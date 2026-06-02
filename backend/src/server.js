require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const cluster    = require('cluster');
const os         = require('os');

const connectDB       = require('./config/db');
const authRoutes      = require('./routes/authRoutes');
const testRoutes      = require('./routes/testRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiTutorRoutes   = require('./routes/aiTutorRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const feedbackRoutes  = require('./routes/feedbackRoutes');

// ─── Free-tier clustering (zero cost, uses all CPU cores) ─────────────────
// On Render/Railway free tier you get 0.5–1 vCPU so this usually = 1 worker,
// but on any paid plan it automatically scales to fill all cores.
if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`Primary process ${process.pid} — forking ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died — restarting`);
    cluster.fork();
  });
} else {
  startServer();
}

function startServer() {
  // ── Startup safety check ─────────────────────────────────────────────────
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_in_production') {
    console.error('FATAL: JWT_SECRET is not set or is using the default value. Set it in your .env file.');
    process.exit(1);
  }

  const app = express();

  connectDB();

  // ── Security & Middleware ─────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    // FIX: Support multiple allowed origins (comma-separated in env var)
    origin: (origin, callback) => {
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,  
  }));
  app.use(express.json({ limit: '1mb' })); // reduced from 2mb — 1mb is plenty for exam responses
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // NOTE: These use in-memory store. Works fine for single-process / free tier.
  // If you later add multiple processes/servers, swap store to rate-limit-redis.
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts.' },
  });

  // FIX: Dedicated AI limiter — prevents Anthropic API cost abuse
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute window
    max: 8,                     // 8 AI calls per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'AI rate limit reached. Please wait a moment.' },
  });

  app.use('/api/', globalLimiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/ai/', aiLimiter); // FIX: AI routes now throttled

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth',      authRoutes);
  app.use('/api/tests',     testRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/ai',        aiTutorRoutes);
  app.use('/api/admin',     adminRoutes);
  app.use('/api/feedback', feedbackRoutes);

  app.get('/api/health', (req, res) =>
    res.json({ success: true, message: 'NEET PG Platform API running', timestamp: new Date() })
  );

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((req, res) =>
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
  );

  // ── Global error handler ──────────────────────────────────────────────────
  // FIX: Stack trace now only shown when NODE_ENV is explicitly 'development'
  // Unset NODE_ENV (a common deploy mistake) defaults to NO stack trace.
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} → http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      try {
        await fetch(`https://medrank-cbt-platform.onrender.com/api/health`);
        console.log('Self-ping OK');
      } catch (_) {}
    }, 14 * 60 * 1000);
  }

  module.exports = app;
}
