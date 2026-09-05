const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-process token blacklist (logout revocation).
// On free tier with a single dyno this works fine.
// If you later scale to multiple processes, move this to MongoDB:
//   store { token_hash, expires_at } and TTL-index on expires_at.
const blacklist = new Set();

const revokeToken = (token) => blacklist.add(token);

// ─── Real "last seen" tracking ──────────────────────────────────────────────
// lastActive used to only update on login and on test submission, so admin's
// "active now" metric had no real presence data to read from. We now stamp it
// on every authenticated request, but throttled to once per user per window
// so a user clicking around doesn't turn into a DB write on every API call.
const ACTIVITY_THROTTLE_MS = 60 * 1000; // 1 min

const touchLastActive = (user) => {
  const now = Date.now();
  const last = user.lastActive ? new Date(user.lastActive).getTime() : 0;
  if (now - last < ACTIVITY_THROTTLE_MS) return; // seen recently, skip the write

  // Fire-and-forget: never let presence tracking add latency or block the
  // request, and never let it fail the request if the write errors.
  User.updateOne({ _id: user._id }, { $set: { lastActive: new Date(now) } }).catch((err) => {
    console.warn('Failed to update lastActive:', err.message);
  });
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Check logout blacklist first (cheap, no DB hit)
    if (blacklist.has(token)) {
      return res.status(401).json({ success: false, message: 'Token revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user  = user;
    req.token = token; // needed for logout
    touchLastActive(user);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly, revokeToken };