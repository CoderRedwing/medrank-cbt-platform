const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { revokeToken } = require('../middleware/auth');
const crypto = require('crypto');
const { encryptApiKey } = require('../utils/apiKeyCrypto');
const { verifyApiKey, PROVIDER_LABELS } = require('../services/Aiproviderclient');
const { mapProviderError } = require("../utils/providerErrorMapper");
const VALID_PROVIDERS = ['anthropic', 'openai', 'gemini'];
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../services/emailServices');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { name, email, password, targetExam } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, targetExam });

    // Send welcome email — fire and forget, never blocks the response
    sendWelcomeEmail({ name, email, targetExam }).catch(() => { });

    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Fallback URL safety check
    const frontendBaseUrl = process.env.FRONTEND_URL || 'https://medrank-cbt-platform.vercel.app';
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;

    // 🟢 Bulletproof email execution wrapper
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });

      return res.json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (emailError) {
      // Clean up token states if mail transmission completely fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Email Delivery Error:', emailError);
      return res.status(500).json({
        success: false,
        message: emailError.message,
      });
    }

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalid or expired',
      });
    }

    user.password = req.body.password;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    sendToken(user, 200, res);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/me
const updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'targetExam'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/api-key — save/update one of the user's AI provider keys
// Body: { provider: 'anthropic'|'openai'|'gemini', api_key, set_active? }
// A student can store up to 3 keys (one per provider) and use whichever
// works for them — not every provider needs to be paid/free at once.
const saveApiKey = async (req, res) => {
  try {
    const { api_key, set_active } = req.body;
    const provider = req.body.provider || 'anthropic'; // default for older clients
    if (!api_key || typeof api_key !== 'string' || !api_key.trim()) {
      return res.status(400).json({ success: false, message: 'api_key is required' });
    }
    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, message: `Unsupported provider "${provider}". Choose anthropic, openai, or gemini.` });
    }
    const trimmed = api_key.trim();


    if (trimmed.length < 10) {
      return res.status(400).json({
        success: false,
        message: "API key looks too short.",
      });
    }


    try {
      await verifyApiKey({
        provider,
        apiKey: trimmed,
      });
    } catch (err) {

      const mapped = mapProviderError(err);

      return res.status(mapped.status).json(mapped);

    }

    const encrypted = encryptApiKey(trimmed);
    const last4 = trimmed.slice(-4);

    const user = await User.findById(req.user._id);
    if (!user.aiProviders) user.aiProviders = {};
    user.aiProviders[provider] = { encrypted, last4 };
    user.markModified('aiProviders');

    // Make this the active provider unless the caller explicitly opts out,
    // or the user already has a different provider active.
    if (set_active !== false || !user.aiActiveProvider) {
      user.aiActiveProvider = provider;
    }
    await user.save();

    res.json({
      success: true,
      message: `${PROVIDER_LABELS[provider]} key saved`,
      data: { provider, last4, active_provider: user.aiActiveProvider },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/auth/api-key/:provider — remove one stored provider key
const removeApiKey = async (req, res) => {
  try {
    const provider = req.params.provider || 'anthropic';
    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, message: `Unsupported provider "${provider}"` });
    }

    const user = await User.findById(req.user._id).select('+aiApiKeyEncrypted');
    if (user.aiProviders?.[provider]) {
      user.aiProviders[provider] = { encrypted: null, last4: null };
      user.markModified('aiProviders');
    }
    // Legacy cleanup — old accounts stored an Anthropic-only key separately.
    if (provider === 'anthropic') {
      user.aiApiKeyEncrypted = null;
      user.aiApiKeyLast4 = null;
    }
    if (user.aiActiveProvider === provider) {
      const remaining = VALID_PROVIDERS.find(
        (p) => p !== provider && user.aiProviders?.[p]?.encrypted
      );
      user.aiActiveProvider = remaining || null;
    }
    await user.save();

    res.json({ success: true, message: 'API key removed', data: { provider, active_provider: user.aiActiveProvider } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/api-key/active — switch which saved key AI Tutor uses
// Body: { provider }
const setActiveApiKeyProvider = async (req, res) => {
  try {
    const { provider } = req.body;
    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, message: `Unsupported provider "${provider}"` });
    }

    const user = await User.findById(req.user._id).select('+aiApiKeyEncrypted');
    const hasKey = !!(user.aiProviders?.[provider]?.encrypted || (provider === 'anthropic' && user.aiApiKeyEncrypted));
    if (!hasKey) {
      return res.status(400).json({ success: false, message: `Add a ${PROVIDER_LABELS[provider]} key first.` });
    }

    user.aiActiveProvider = provider;
    await user.save();

    res.json({ success: true, data: { active_provider: provider } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  if (req.token) revokeToken(req.token);
  res.json({ success: true, message: 'Logged out' });
};

module.exports = { register, login, getMe, updateMe, logout, forgotPassword, resetPassword, saveApiKey, removeApiKey, setActiveApiKeyProvider };