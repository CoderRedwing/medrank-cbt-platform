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
  loadLiveTestPaper
} = require('../config/dataset');
const { computeAnalysis, mergeIntoUserStats } = require('./analysisEngine');
const User = require('../models/User');
const { notifyUser } = require('../services/notificationService');
const LiveTest = require("../models/LiveTest");

const UNLOCK_THRESHOLD_PERCENT = 70;

// ─── Generalised sequential-unlock engine ─────────────────────────────────
// Applies to subject_paper, topic_wise, and full_paper. Each test_type is
// grouped into a "sequence" (subject_paper/topic_wise: grouped by subject;
// full_paper: one single global sequence) and unlocked in order — the first
// item in a sequence is always unlocked, every following item needs a
// submitted score >= UNLOCK_THRESHOLD_PERCENT on the immediately preceding
// item in that same sequence.

const idOf = (item) => item.paper_id || item.bank_id;

// Human-readable label for an item, used in "locked" messages/hints.
const labelOf = (item, test_type) => {
  if (test_type === 'subject_paper') return `${item.subject} Paper ${item.paper_number}`;
  if (test_type === 'full_paper')    return item.paper_title || `Full Paper ${item.paper_number}`;
  if (test_type === 'topic_wise')    return `${item.subject} — ${item.topic}`;
  return idOf(item);
};

// subject_paper & topic_wise unlock sequentially within each subject;
// full_paper has no subject split — it's one global sequence.
const groupKeyFor = (test_type, item) => (test_type === 'full_paper' ? 'ALL' : item.subject);

const indexLoaderFor = {
  subject_paper: getSubjectPaperIndex,
  topic_wise:    getTopicBankIndex,
  full_paper:    getFullPaperIndex,
};

// Builds { itemId -> { position (0-based), prevId, prevLabel } } for a test_type.
// Ordering uses paper_number when present (subject_paper/full_paper); falls
// back to original dataset array order otherwise (topic_wise has no
// paper_number, so topics are unlocked in the order they appear per subject).
const buildOrderMap = (items, test_type) => {
  const groups = {};
  items.forEach((item, idx) => {
    const key = groupKeyFor(test_type, item);
    (groups[key] ||= []).push({ item, idx });
  });

  const orderMap = {};
  Object.values(groups).forEach((group) => {
    group.sort((a, b) => (a.item.paper_number ?? a.idx) - (b.item.paper_number ?? b.idx));
    group.forEach((entry, i) => {
      orderMap[idOf(entry.item)] = {
        position: i,
        prevId:    i > 0 ? idOf(group[i - 1].item) : null,
        prevLabel: i > 0 ? labelOf(group[i - 1].item, test_type) : null,
      };
    });
  });
  return orderMap;
};

// Throws if the user hasn't scored >=UNLOCK_THRESHOLD_PERCENT% on the
// immediately preceding item in the same sequence. No-ops for test types
// without a locking sequence (e.g. live_test).
const assertPaperUnlocked = async (userId, test_type, paperId) => {
  const loadIndex = indexLoaderFor[test_type];
  if (!loadIndex) return;

  const orderMap = buildOrderMap(loadIndex(), test_type);
  const info = orderMap[paperId];
  if (!info || info.position === 0) return; // first in sequence — always unlocked

  const priorBest = await TestSession.find({
    user: userId,
    test_type,
    paper_ref: info.prevId,
    status: 'submitted',
  }).select('score');

  const bestPercent = priorBest.reduce((max, s) => Math.max(max, s.score?.percent ?? 0), 0);

  if (bestPercent < UNLOCK_THRESHOLD_PERCENT) {
    throw new Error(
      `Locked: score ${UNLOCK_THRESHOLD_PERCENT}%+ in "${info.prevLabel}" to unlock this.`
    );
  }
};

// Decorates a list of dataset items with locked/unlock_hint info for a given
// user (or leaves everything unlocked if there's no user, e.g. public browse).
const decorateWithLocks = async (items, test_type, userId) => {
  if (!userId) {
    return items.map((p) => ({ ...p, locked: false, unlock_threshold_percent: UNLOCK_THRESHOLD_PERCENT }));
  }

  const orderMap = buildOrderMap(items, test_type);

  const sessions = await TestSession.find({
    user: userId,
    test_type,
    status: 'submitted',
  }).select('paper_ref score');

  const bestPercentByRef = {};
  sessions.forEach((s) => {
    const pct = s.score?.percent ?? 0;
    if (!(s.paper_ref in bestPercentByRef) || pct > bestPercentByRef[s.paper_ref]) {
      bestPercentByRef[s.paper_ref] = pct;
    }
  });

  return items.map((item) => {
    const info = orderMap[idOf(item)];
    let locked = false;
    let unlockHint = null;
    if (info && info.position > 0) {
      const prevBest = bestPercentByRef[info.prevId] ?? 0;
      locked = prevBest < UNLOCK_THRESHOLD_PERCENT;
      if (locked) {
        unlockHint = `Score ${UNLOCK_THRESHOLD_PERCENT}%+ in "${info.prevLabel}" to unlock`;
      }
    }
    return { ...item, locked, unlock_threshold_percent: UNLOCK_THRESHOLD_PERCENT, unlock_hint: unlockHint };
  });
};

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
    await assertPaperUnlocked(userId, test_type, paper_ref);
    allQuestions = paper.questions;
    paperTitle   = paper.paper_title;
    durationSec  = paper.duration_minutes * 60;
  } else if (test_type === 'subject_paper') {
    paper = loadSubjectPaper(paper_ref);
    if (!paper) throw new Error(`Subject paper ${paper_ref} not found`);
    await assertPaperUnlocked(userId, test_type, paper_ref);
    allQuestions = paper.questions;
    paperTitle   = paper.paper_title;
    subject      = paper.subject;
    durationSec  = paper.duration_minutes * 60;
  } else if (test_type === 'topic_wise') {
    paper = loadTopicBank(paper_ref);
    if (!paper) throw new Error(`Topic bank ${paper_ref} not found`);
    await assertPaperUnlocked(userId, test_type, paper_ref);
    allQuestions = paper.questions;
    paperTitle   = `${paper.subject} — ${paper.topic} Practice`;
    subject      = paper.subject;
    topic        = paper.topic;
    durationSec  = Math.min(allQuestions.length * 90, 90 * 60); // ~90s/q, max 90 min
  } else if (test_type === 'live_test') {
    // Gatekeeper for ALL live-test entry points (this function is called both
    // directly by POST /api/tests/start and internally by createLiveTestSession).
    // Enforces: paper must be a scheduled live test, current time must be inside
    // its window, and the user must be on the registered list — otherwise anyone
    // could start/see the paper by guessing or replaying the paper_ref.
    const liveTestDoc = await LiveTest.findOne({ paper_ref });
    if (!liveTestDoc) throw new Error(`Live test ${paper_ref} not found`);

    const nowTs = new Date();
    if (nowTs < liveTestDoc.starts_at) throw new Error('This live test has not started yet.');
    if (nowTs > liveTestDoc.ends_at) throw new Error('This live test has ended.');

    const isRegistered = (liveTestDoc.registered_users || []).some(
      (id) => id.toString() === userId.toString()
    );
    if (!isRegistered) {
      throw new Error('You are not registered for this live quiz. Registration was required before it started.');
    }

    paper = loadLiveTestPaper(paper_ref);
    if (!paper) throw new Error(`Live test ${paper_ref} not found`);
    allQuestions = paper.questions;
    paperTitle   = paper.paper_title;
    subject      = paper.subject || 'Mixed';
    durationSec  = paper.duration_minutes * 60;
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

    // ─── Image-based question support ───────────────────────────────────
    is_image_based:  q.is_image_based || q.image_based || false,
    image_url:       q.image_url   || '',
    image_title:     q.image_title || '',
    key_findings:    q.key_findings || [],
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
    if (session.test_type === 'live_test') {
      sourceQuestions = loadLiveTestPaper(session.paper_ref)?.questions || [];
    } else if (session.test_type === 'full_paper') {
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

      // ─── Image-based question support ─────────────────────────────────
      resp.is_image_based = q.is_image_based ?? q.image_based ?? false;
      resp.image_url      = q.image_url   || '';
      resp.image_title    = q.image_title || '';
      resp.key_findings    = q.key_findings || [];
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

  // ── Notify the user their result is ready ──────────────────────────────
  try {
    await notifyUser(userId, {
      type: 'result_ready',
      title: 'Your result is ready',
      body: `${session.paper_title} — scored ${session.score.percent}%`,
      link: `/analysis/${session._id}`,
    });
  } catch (e) {
    // Notification failure should never block test submission
    console.warn('Failed to create result notification:', e.message);
  }

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

const listAvailablePapers = async (userId) => {
  const [decoratedFullPapers, decoratedSubjectPapers, decoratedTopicBanks] = await Promise.all([
    decorateWithLocks(getFullPaperIndex(),    'full_paper',   userId),
    decorateWithLocks(getSubjectPaperIndex(), 'subject_paper', userId),
    decorateWithLocks(getTopicBankIndex(),    'topic_wise',   userId),
  ]);

  return {
    full_papers:    decoratedFullPapers,
    subject_papers: decoratedSubjectPapers,
    topic_banks:    decoratedTopicBanks,
  };
};

const REGISTRATION_CLOSE_MINUTES_BEFORE = 15;

const getActiveLiveTest = async (userId) => {

    const now = new Date();

    await LiveTest.updateMany(
        {
            starts_at: { $lte: now },
            ends_at: { $gt: now },
            status: "upcoming"
        },
        {
            status: "live"
        }
    );

    await LiveTest.updateMany(
        {
            ends_at: { $lte: now },
            status: "live"
        },
        {
            status: "ended"
        }
    );

    // Show the nearest upcoming/live test (live first, else soonest upcoming)
    const liveTest = await LiveTest.findOne({ status: "live" })
        || await LiveTest.findOne({ status: "upcoming" }).sort({ starts_at: 1 });

    if (!liveTest) return null;

    let alreadyAttempted = false;
    if (userId) {
        const priorSession = await TestSession.findOne({
            user: userId,
            test_type: 'live_test',
            paper_ref: liveTest.paper_ref,
            status: 'submitted',
        }).select('_id score');
        alreadyAttempted = !!priorSession;
    }

    const paperMeta = loadLiveTestPaper(liveTest.paper_ref);

    const registrationClosesAt = new Date(
        liveTest.starts_at.getTime() - REGISTRATION_CLOSE_MINUTES_BEFORE * 60 * 1000
    );
    const isRegistered = !!(userId && (liveTest.registered_users || []).some(
        (id) => id.toString() === userId.toString()
    ));

    const { registered_users, ...liveTestPublic } = liveTest.toObject();

    return {
        ...liveTestPublic,
        total_questions: paperMeta?.total_questions ?? paperMeta?.questions?.length ?? null,
        duration_minutes: paperMeta?.duration_minutes ?? null,
        already_attempted: alreadyAttempted,
        registration_closes_at: registrationClosesAt,
        registration_open: new Date() < registrationClosesAt,
        is_registered: isRegistered,
        registered_count: registered_users?.length || 0,
    };

};

// ─── Register for the upcoming/live live test ─────────────────────────────
// Registration auto-closes REGISTRATION_CLOSE_MINUTES_BEFORE minutes before
// the scheduled start.

const registerForLiveTest = async (userId) => {
  const liveTest = await LiveTest.findOne({ status: 'live' })
    || await LiveTest.findOne({ status: 'upcoming' }).sort({ starts_at: 1 });

  if (!liveTest) throw new Error('No live test scheduled right now.');

  const registrationClosesAt = new Date(
    liveTest.starts_at.getTime() - REGISTRATION_CLOSE_MINUTES_BEFORE * 60 * 1000
  );
  if (new Date() >= registrationClosesAt) {
    throw new Error(
      `Registration is closed — it auto-closes ${REGISTRATION_CLOSE_MINUTES_BEFORE} minutes before the quiz starts.`
    );
  }

  await LiveTest.updateOne({ _id: liveTest._id }, { $addToSet: { registered_users: userId } });

  return { registered: true, paper_ref: liveTest.paper_ref, paper_title: liveTest.paper_title };
};

// ─── Start Live Test ─────────────────────────────────────────────

const createLiveTestSession = async (userId) => {

  const liveTest = await LiveTest.findOne({
    status: "live"
  });

  if (!liveTest)
    throw new Error("No live test available right now.");

  const now = new Date();

  if (now < liveTest.starts_at)
    throw new Error("Live test has not started.");

  if (now > liveTest.ends_at)
    throw new Error("Live test has ended.");

  const priorSession = await TestSession.findOne({
    user: userId,
    test_type: 'live_test',
    paper_ref: liveTest.paper_ref,
  });
  if (priorSession) {
    if (priorSession.status === 'submitted') {
      throw new Error("You have already attempted this live test.");
    }
    // Resume an in-progress attempt instead of creating a duplicate
    const paperData = loadLiveTestPaper(liveTest.paper_ref);
    const idOrder = priorSession.responses.map(r => r.question_id);
    const qById = {};
    (paperData?.questions || []).forEach(q => { qById[q.question_id] = q; });
    const orderedQuestions = idOrder.map(id => qById[id]).filter(Boolean);

    return {
      session_id:           priorSession._id,
      test_type:            priorSession.test_type,
      paper_ref:            priorSession.paper_ref,
      paper_title:          priorSession.paper_title,
      subject:              priorSession.subject,
      topic:                priorSession.topic,
      duration_allowed_sec: priorSession.duration_allowed_sec,
      total_questions:      priorSession.total_questions,
      questions:            sanitiseForTest(orderedQuestions),
      resumed: true,
    };
  }

  return createTestSession(userId, {
    test_type: "live_test",
    paper_ref: liveTest.paper_ref
  });

};

// ─── Submit Live Test ─────────────────────────────────────────────

const submitLiveTest = async (
  sessionId,
  userId,
  responses,
  timeTakenSec
) => {

  return submitTest(
    sessionId,
    userId,
    responses,
    timeTakenSec
  );

};

module.exports = {
  createTestSession,
  saveResponse,
  submitTest,
  getUserTestHistory,
  getSessionDetail,
  listAvailablePapers,
  getActiveLiveTest,
createLiveTestSession,
submitLiveTest,
registerForLiveTest,
};