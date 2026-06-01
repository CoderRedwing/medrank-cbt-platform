const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-process token blacklist (logout revocation).
// On free tier with a single dyno this works fine.
// If you later scale to multiple processes, move this to MongoDB:
//   store { token_hash, expires_at } and TTL-index on expires_at.
const blacklist = new Set();

const revokeToken = (token) => blacklist.add(token);

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
