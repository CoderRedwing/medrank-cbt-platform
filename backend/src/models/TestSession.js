const mongoose = require('mongoose');

// ─── Per-question response ─────────────────────────────────────────────────
const questionResponseSchema = new mongoose.Schema(
  {
    question_id:     { type: String, required: true },
    subject:         { type: String, required: true },
    topic:           { type: String, default: '' },
    subtopic:        { type: String, default: '' },
    difficulty:      { type: String, enum: ['Easy', 'Medium', 'Hard', 'Very Hard','Moderate'] },
    // Student's selected option (null = unanswered)
    selected_answer: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
    correct_answer:  { type: String, enum: ['A', 'B', 'C', 'D'] },
    is_correct:      { type: Boolean, default: false },
    is_attempted:    { type: Boolean, default: false },
    marks_awarded:   { type: Number, default: 0 }, // +4 / -1 / 0
    // "Why do you think this is correct?" — student justification (Phase 1+)
    student_reason:  { type: String, default: '' },
    // AI confidence check result (Phase 3)
    knowledge_verified: { type: Boolean, default: null },
    ai_feedback:     { type: String, default: '' },
    // Time spent on this question (seconds)
    time_spent_sec:  { type: Number, default: 0 },
    // Was the question marked for review?
    marked_review:   { type: Boolean, default: false },

    question_text:   { type: String, default: '' },   // snapshot of question
    options: {                                         // snapshot of options
      A: { type: String, default: '' },
      B: { type: String, default: '' },
      C: { type: String, default: '' },
      D: { type: String, default: '' },
    },
    explanation:     { type: String, default: '' }, 
    is_image_based:  { type: Boolean, default: false },
    image_url:       { type: String, default: '' },
    image_title:     { type: String, default: '' },
    key_findings:    { type: [String], default: [] },
  },
  { _id: false }
);

// ─── TestSession ──────────────────────────────────────────────────────────
const testSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Type of test
    test_type: {
      type: String,
      enum: ['full_paper', 'subject_paper', 'topic_wise', 'custom', 'ai_generated',  "live_test"],
      required: true,
    },
    // Reference to the paper/bank used
    paper_ref:   { type: String, required: true }, // e.g. "FP_01", "SP_MEDICINE_02"
    difficulty: { 
      type: String, 
      enum: ['Easy', 'Medium', 'Hard', 'Very Hard', 'Moderate'],  
    },
    paper_title: { type: String, default: '' },
    // Subject / topic scope (for subject/topic tests)
    subject:     { type: String, default: '' },
    topic:       { type: String, default: '' },

    // Session state
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'timed_out', 'abandoned'],
      default: 'in_progress',
      index: true,
    },

    // Timing
    started_at:   { type: Date, default: Date.now },
    submitted_at: { type: Date, default: null },
    duration_allowed_sec: { type: Number, required: true }, // total allowed seconds
    time_taken_sec:       { type: Number, default: 0 },     // actual time used

    // Questions (sanitised — no correct_answer stored here, only in responses)
    total_questions: { type: Number, required: true },

    // Responses — one per question
    responses: [questionResponseSchema],

    // ─── Scoring ────────────────────────────────────────────────────────
    score: {
      raw:       { type: Number, default: 0 }, // actual marks
      max:       { type: Number, default: 0 }, // max possible marks
      percent:   { type: Number, default: 0 }, // raw/max * 100
    },
    correct_count:   { type: Number, default: 0 },
    incorrect_count: { type: Number, default: 0 },
    unattempted_count: { type: Number, default: 0 },
    accuracy:        { type: Number, default: 0 }, // correct/attempted * 100

    // ─── Analysis snapshots ───────────────────────────────────────────
    // Subject-wise breakdown: { Medicine: { correct, incorrect, unattempted, score, accuracy } }
    subject_analysis: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Topic-wise breakdown: { 'Medicine::Cardiology': { ... } }
    topic_analysis: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Difficulty breakdown
    difficulty_analysis: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Weak areas identified
    weak_subjects: [String],
    weak_topics:   [String],
    // Suggested focus areas (based on exam weightage + accuracy)
    focus_suggestions: [
      {
        subject:  String,
        topic:    String,
        reason:   String,
        priority: { type: String, enum: ['critical', 'high', 'medium'] },
      },
    ],
  },
  { timestamps: true }
);

// Index for fast user history queries
testSessionSchema.index({ user: 1, status: 1, createdAt: -1 });
testSessionSchema.index({ user: 1, test_type: 1 });

module.exports = mongoose.model('TestSession', testSessionSchema);
