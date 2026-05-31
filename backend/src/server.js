require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB       = require('./config/db');
const authRoutes      = require('./routes/authRoutes');
const testRoutes      = require('./routes/testRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiTutorRoutes   = require('./routes/aiTutorRoutes');
const adminRoutes     = require('./routes/adminRoutes');

const app = express();

// ─── Connect DB ─────────────────────────────────────────────────────────────
connectDB();

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/tests',     testRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai',        aiTutorRoutes);
app.use('/api/admin',     adminRoutes);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'NEET PG Platform API running', timestamp: new Date() })
);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NEET PG Platform API → http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
