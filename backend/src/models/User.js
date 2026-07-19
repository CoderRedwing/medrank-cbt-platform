const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    // Exam target
    targetExam: {
      type: String,
      enum: ['NEET_PG', 'INI_CET', 'FMGE', 'OTHER'],
      default: 'NEET_PG',
    },
    // Aggregate stats (denormalised for fast dashboard)
    stats: {
      totalTestsTaken:    { type: Number, default: 0 },
      totalQuestionsAttempted: { type: Number, default: 0 },
      totalCorrect:       { type: Number, default: 0 },
      totalIncorrect:     { type: Number, default: 0 },
      totalScore:         { type: Number, default: 0 },
      averageAccuracy:    { type: Number, default: 0 }, // percent
      averageScore:       { type: Number, default: 0 },
      // Subject-level accuracy map: { Medicine: { correct, attempted }, ... }
      subjectAccuracy:    { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
      // Topic-level accuracy map: { 'Medicine::Cardiology': { correct, attempted }, ... }
      topicAccuracy:      { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    },

     feedback: {
      rating:              { type: Number, min: 1, max: 5 },
      comment:             { type: String, maxlength: 500 },
      category:            {
        type: String,
        enum: ['Bug', 'Suggestion', 'Content Error', 'General'],
        default: 'General',
      },
      submittedAt:         { type: Date },
      testsCompletedAtTime:{ type: Number },
    },

    lastActive: { type: Date, default: Date.now },
    passwordResetToken: String,
    passwordResetExpires: Date,

    // ─── User-supplied AI API key (BYOK for AI Tutor feature) ───────────
    // Legacy single-key fields (Anthropic-only) — kept for backward
    // compatibility with accounts created before multi-provider support.
    // Stored encrypted; never sent to the client. select:false so normal
    // queries never accidentally leak it.
    aiApiKeyEncrypted: { type: String, select: false, default: null },
    aiApiKeyLast4:     { type: String, default: null }, // for display, e.g. "…af92"

    // ─── Multi-provider BYOK ─────────────────────────────────────────────
    // A student can store up to one key per supported provider (Anthropic,
    // OpenAI, Gemini) and pick which one is "active" for AI Tutor calls.
    // Encrypted values are stripped in toJSON below rather than marked
    // select:false, so a single findById() can read whichever key is active.
    aiProviders: {
      anthropic: {
        encrypted: { type: String, default: null },
        last4:     { type: String, default: null },
      },
      openai: {
        encrypted: { type: String, default: null },
        last4:     { type: String, default: null },
      },
      gemini: {
        encrypted: { type: String, default: null },
        last4:     { type: String, default: null },
      },
    },
    aiActiveProvider: {
      type: String,
      enum: ['anthropic', 'openai', 'gemini', null],
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ role: 1, createdAt: -1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.aiApiKeyEncrypted;
  if (obj.aiProviders) {
    Object.values(obj.aiProviders).forEach((p) => { if (p) delete p.encrypted; });
  }
  return obj;
};

module.exports = mongoose.model('User', userSchema);