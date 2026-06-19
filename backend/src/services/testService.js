// testService.js ke top mein add karo
const { invalidateDashboardCache } = require('../controllers/dashboardController');
const TestSession = require('../models/TestSession');
const {
  loadFullPaper,
  loadSubjectPaper,
  loadTopicBank,
  sampleQuestions,
  sanitiseForTest,
  buildAnswerKey,
  getFullPaperIndex,
  getSubjectPaperIndex,
  getTopicBankIndex,
} = require('../config/dataset');
const { computeAnalysis, mergeIntoUserStats } = require('./analysisEngine');
const User = require('../models/User');

// ─── Create a new test session ─────────────────────────────────────────────

const createTestSession = async (userId, options) => {
  const { test_type, paper_ref, questionCount, difficulty } = options;

  let paper = null;
  let allQuestions = [];
  let paperTitle = '';
  let subject = '';
  let topic = '';
  let durationSec = 210 * 60; // default 3h30m (full paper)

  if (test_type === 'full_paper') {
    paper = loadFullPaper(paper_ref);
    if (!paper) throw new Error(`Full paper ${paper_ref} not found`);
    allQuestions = paper.questions;
    paperTitle   = paper.paper_title;
    durationSec  = paper.duration_minutes * 60;
  } else if (test_type === 'subject_paper') {
    paper = loadSubjectPaper(paper_ref);
    if (!paper) throw new Error(`Subject paper ${paper_ref} not found`);
    allQuestions = paper.questions;
    paperTitle   = paper.paper_title;
    subject      = paper.subject;
    durationSec  = paper.duration_minutes * 60;
  } else if (test_type === 'topic_wise') {
    paper = loadTopicBank(paper_ref);
    if (!paper) throw new Error(`Topic bank ${paper_ref} not found`);
    allQuestions = paper.questions;
    paperTitle   = `${paper.subject} — ${paper.topic} Practice`;
    subject      = paper.subject;
    topic        = paper.topic;
    durationSec  = Math.min(allQuestions.length * 90, 90 * 60); // ~90s/q, max 90 min
  } else {
    throw new Error(`Unknown test_type: ${test_type}`);
  }

  // Sample if fewer questions requested
  const finalCount = questionCount || allQuestions.length;
  const selectedQuestions = sampleQuestions(allQuestions, finalCount, difficulty || null);

  // Recalculate duration proportionally for partial tests
  if (questionCount && test_type === 'full_paper') {
    durationSec = Math.round((questionCount / 200) * 210 * 60);
  }
  if (questionCount && test_type === 'subject_paper') {
    durationSec = Math.round((questionCount / 100) * 90 * 60);
  }

  // Build answer key (server-side only)
  const answerKey = buildAnswerKey(selectedQuestions);

  // Create empty responses (one per question)
  const responses = selectedQuestions.map((q) => ({
    question_id:    q.question_id,
    subject:        q.subject,
    topic:          q.topic || '',
    subtopic:       q.subtopic || '',
    difficulty:     q.difficulty,
    selected_answer: null,
    correct_answer:  answerKey[q.question_id].correct_answer,
    is_correct:      false,
    is_attempted:    false,
    marks_awarded:   0,
    student_reason:  '',
    time_spent_sec:  0,
    marked_review:   false,
  }));

  const session = await TestSession.create({
    user:                userId,
    test_type,
    paper_ref,
    paper_title:         paperTitle,
    subject,
    topic,
    status:              'in_progress',
    duration_allowed_sec: durationSec,
    total_questions:     selectedQuestions.length,
    responses,
  });

  return {
    session_id:      session._id,
    test_type,
    paper_ref,
    paper_title:     paperTitle,
    subject,
    topic,
    duration_allowed_sec: durationSec,
    total_questions: selectedQuestions.length,
    // Send questions WITHOUT answers to frontend
    questions:       sanitiseForTest(selectedQuestions),
  };
};

// ─── Save incremental response (auto-save) ────────────────────────────────

const saveResponse = async (sessionId, userId, questionId, data) => {
  const session = await TestSession.findOne({ _id: sessionId, user: userId, status: 'in_progress' });
  if (!session) throw new Error('Session not found or already submitted');

  const resp = session.responses.find((r) => r.question_id === questionId);
  if (!resp) throw new Error('Question not found in session');

  resp.selected_answer = data.selected_answer !== undefined ? data.selected_answer : resp.selected_answer;
  resp.student_reason  = data.student_reason  !== undefined ? data.student_reason  : resp.student_reason;
  resp.time_spent_sec  = data.time_spent_sec  !== undefined ? data.time_spent_sec  : resp.time_spent_sec;
  resp.marked_review   = data.marked_review   !== undefined ? data.marked_review   : resp.marked_review;
  resp.is_attempted    = resp.selected_answer !== null;

  await session.save();
  return { saved: true };
};

// ─── Submit test & compute full analysis ─────────────────────────────────

const submitTest = async (sessionId, userId, allResponses, timeTakenSec) => {
  const session = await TestSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw new Error('Session not found');
  if (session.status === 'submitted') {
    // Return existing analysis
    return session;
  }

  // Merge any final responses passed in
  if (allResponses && Array.isArray(allResponses)) {
    allResponses.forEach((r) => {
      const stored = session.responses.find((s) => s.question_id === r.question_id);
      if (stored) {
        stored.selected_answer = r.selected_answer !== undefined ? r.selected_answer : stored.selected_answer;
        stored.student_reason  = r.student_reason  !== undefined ? r.student_reason  : stored.student_reason;
        stored.time_spent_sec  = r.time_spent_sec  !== undefined ? r.time_spent_sec  : stored.time_spent_sec;
        stored.marked_review   = r.marked_review   !== undefined ? r.marked_review   : stored.marked_review;
        stored.is_attempted    = stored.selected_answer !== null;
      }
    });
  }


  // ── BUILD question map from JSON source ───────────────────────────────
  let sourceQuestions = [];
  try {
    if (session.test_type === 'full_paper') {
      sourceQuestions = loadFullPaper(session.paper_ref)?.questions || [];
    } else if (session.test_type === 'subject_paper') {
      sourceQuestions = loadSubjectPaper(session.paper_ref)?.questions || [];
    } else if (session.test_type === 'topic_wise') {
      sourceQuestions = loadTopicBank(session.paper_ref)?.questions || [];
    }
  } catch (e) {
    console.warn('Could not load source questions for snapshot:', e.message);
  }

  const qMap = {};
  sourceQuestions.forEach(q => { qMap[q.question_id] = q; });
  // ─────────────────────────────────────────────────────────────────────

  // ── Snapshot question text/options/explanation into each response ─────
  session.responses.forEach(resp => {
    const q = qMap[resp.question_id];
    if (q) {
      resp.question_text = q.question_text || q.question || q.stem || '';
      resp.options       = q.options || {};
      resp.explanation   = q.explanation || q.explanation_text || '';
    }
  });

  // Compute analysis
  const analysis = computeAnalysis(session.responses);

  // Update session with analysis results
  session.status              = 'submitted';
  session.submitted_at        = new Date();
  session.time_taken_sec      = timeTakenSec || 0;
  session.responses           = analysis.processedResponses;
  session.score               = analysis.score;
  session.correct_count       = analysis.correct_count;
  session.incorrect_count     = analysis.incorrect_count;
  session.unattempted_count   = analysis.unattempted_count;
  session.accuracy            = analysis.accuracy;
  session.subject_analysis    = analysis.subject_analysis;
  session.topic_analysis      = analysis.topic_analysis;
  session.difficulty_analysis = analysis.difficulty_analysis;
  session.weak_subjects       = analysis.weak_subjects;
  session.weak_topics         = analysis.weak_topics;
  session.focus_suggestions   = analysis.focus_suggestions;

  await session.save();

  // Update user cumulative stats
  await User.findByIdAndUpdate(userId, {
    $set: {
      stats: mergeIntoUserStats(
        (await User.findById(userId)).stats?.toObject?.() || {},
        analysis,
        session.total_questions
      ),
      lastActive: new Date(),
    },
  });
  invalidateDashboardCache(userId);

  return session;
};

// ─── Get test history ────────────────────────────────────────────────────

const getUserTestHistory = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    TestSession.find({ user: userId, status: 'submitted' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-responses'), // exclude heavy responses array from list view
    TestSession.countDocuments({ user: userId, status: 'submitted' }),
  ]);
  return { sessions, total, page, pages: Math.ceil(total / limit) };
};

// ─── Get full session details (for review page) ──────────────────────────

const getSessionDetail = async (sessionId, userId) => {
  const session = await TestSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw new Error('Session not found');
  return session;
};

// ─── List available papers/banks ────────────────────────────────────────

const listAvailablePapers = () => {
  return {
    full_papers:    getFullPaperIndex(),
    subject_papers: getSubjectPaperIndex(),
    topic_banks:    getTopicBankIndex(),
  };
};

module.exports = {
  createTestSession,
  saveResponse,
  submitTest,
  getUserTestHistory,
  getSessionDetail,
  listAvailablePapers,
};
