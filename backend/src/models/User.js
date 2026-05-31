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
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
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
  return obj;
};

module.exports = mongoose.model('User', userSchema);
