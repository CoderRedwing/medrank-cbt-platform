const aiTutorService = require('../services/aiTutorService');
const TestSession    = require('../models/TestSession');
const User           = require('../models/User');
const { decryptApiKey } = require('../utils/apiKeyCrypto');

const NO_KEY_MESSAGE = 'Add an API key (Anthropic, OpenAI, or Gemini) in AI Tutor settings to use AI features.';

// Loads and decrypts the requesting user's currently-active AI provider key.
// Falls back to the legacy single-key (Anthropic) field for accounts that
// added a key before multi-provider support existed.
// Throws a friendly error (caught by callers) if none is set.
const getUserApiKey = async (userId) => {
  const user = await User.findById(userId).select('+aiApiKeyEncrypted');
  if (!user) {
    const err = new Error(NO_KEY_MESSAGE);
    err.code = 'NO_API_KEY';
    throw err;
  }

  const active = user.aiActiveProvider;
  if (active) {
    const entry = user.aiProviders?.[active];
    if (entry?.encrypted) {
      return { provider: active, apiKey: decryptApiKey(entry.encrypted) };
    }
  }

  // Legacy fallback — pre-multi-provider accounts stored a single Anthropic key.
  if (user.aiApiKeyEncrypted) {
    return { provider: 'anthropic', apiKey: decryptApiKey(user.aiApiKeyEncrypted) };
  }

  const err = new Error(NO_KEY_MESSAGE);
  err.code = 'NO_API_KEY';
  throw err;
};

// POST /api/ai/explain
// Body: { question_id, session_id } OR full question object
const explainAnswer = async (req, res) => {
  try {
    const { provider, apiKey } = await getUserApiKey(req.user._id);
    const { session_id, question_id, question_text, options, correct_answer, explanation, subject, topic } = req.body;

    let qData = { question_text, options, correct_answer, explanation, subject, topic };

    // If session_id provided, look up the question from the session
    if (session_id && question_id) {
      const session = await TestSession.findOne({ _id: session_id, user: req.user._id });
      if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

      const resp = session.responses.find((r) => r.question_id === question_id);
      if (!resp) return res.status(404).json({ success: false, message: 'Question not found in session' });

      // We need full question data — merge what we have from response
      qData = {
        question_text: req.body.question_text || resp.question_text || '',
        options:       req.body.options || resp.options || {},
        correct_answer: resp.correct_answer,
        explanation:   req.body.explanation || resp.explanation || '',
        subject:       resp.subject,
        topic:         resp.topic,
      };
    }

    if (!qData.question_text) {
      return res.status(400).json({ success: false, message: 'question_text is required' });
    }

    const deepExplanation = await aiTutorService.explainQuestion({ provider, apiKey, ...qData });
    res.json({ success: true, data: { explanation: deepExplanation, provider } });
  } catch (err) {
    const status = err.code === 'NO_API_KEY' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message, code: err.code });
  }
};

// POST /api/ai/verify-reasoning
// Body: { session_id, question_id } — uses stored student_reason
const verifyReasoning = async (req, res) => {
  try {
    const { provider, apiKey } = await getUserApiKey(req.user._id);
    const { session_id, question_id } = req.body;

    const session = await TestSession.findOne({ _id: session_id, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const resp = session.responses.find((r) => r.question_id === question_id);
    if (!resp) return res.status(404).json({ success: false, message: 'Question not found' });

    const result = await aiTutorService.verifyReasoning({
      provider,
      apiKey,
      question_text:  req.body.question_text || '',
      correct_answer: resp.correct_answer,
      options:        req.body.options || {},
      student_reason: resp.student_reason,
      subject:        resp.subject,
    });

    // Persist result back to session
    resp.knowledge_verified = result.knowledge_verified;
    resp.ai_feedback        = result.feedback;
    await session.save();

    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.code === 'NO_API_KEY' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message, code: err.code });
  }
};

// POST /api/ai/generate
// Body: { subject, topic, count, difficulty }
const generateQuestions = async (req, res) => {
  try {
    const { provider, apiKey } = await getUserApiKey(req.user._id);
    const { subject, topic, count = 10, difficulty = 'Moderate', context } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'subject is required' });

    const cappedCount = Math.min(Math.max(parseInt(count) || 10, 1), 50);
    const questions   = await aiTutorService.generateMCQs({ provider, apiKey, subject, topic, count: cappedCount, difficulty, context });
    res.json({ success: true, data: { questions, count: questions.length } });
  } catch (err) {
    const status = err.code === 'NO_API_KEY' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message, code: err.code });
  }
};

// POST /api/ai/start-generated-test
// Generate questions then immediately create a test session
const startGeneratedTest = async (req, res) => {
  try {
    const { provider, apiKey } = await getUserApiKey(req.user._id);
    const { subject, topic, count = 20, difficulty = 'Moderate' } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'subject is required' });

    const cappedCount = Math.min(Math.max(parseInt(count) || 20, 5), 50);
    const questions   = await aiTutorService.generateMCQs({ provider, apiKey, subject, topic, count: cappedCount, difficulty });

    // Build session manually (no DB paper — all in memory)
    const TestSession = require('../models/TestSession');
    const responses   = questions.map((q) => ({
      question_id:     q.question_id,
      subject:         q.subject,
      topic:           q.topic || '',
      subtopic:        q.subtopic || '',
      difficulty:      q.difficulty,
      question_text:   q.question_text,   // ← NEW
      options:         q.options,          // ← NEW
      explanation:     q.explanation,
      selected_answer: null,
      correct_answer:  q.correct_answer,
      is_correct:      false,
      is_attempted:    false,
      marks_awarded:   0,
      student_reason:  '',
      time_spent_sec:  0,
      marked_review:   false,
    }));

    const durationSec = cappedCount * 90; // ~90s per AI question

    const session = await TestSession.create({
      user:                 req.user._id,
      test_type:            'ai_generated',
      paper_ref:            `AI_${subject}_${topic || 'MIXED'}`,
      paper_title:          `AI Generated — ${subject}${topic ? ' › ' + topic : ''} (${difficulty})`,
      subject,
      topic:                topic || '',
      status:               'in_progress',
      duration_allowed_sec: durationSec,
      total_questions:      questions.length,
      responses,
    });

    // Strip answers before sending to client
    const sanitised = questions.map(({ correct_answer, explanation, ...rest }) => rest);

    res.status(201).json({
      success: true,
      data: {
        session_id:           session._id,
        test_type:            'ai_generated',
        paper_ref:            session.paper_ref,
        paper_title:          session.paper_title,
        subject,
        topic:                topic || '',
        duration_allowed_sec: durationSec,
        total_questions:      questions.length,
        questions:            sanitised,
      },
    });
  } catch (err) {
    const status = err.code === 'NO_API_KEY' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message, code: err.code });
  }
};

// POST /api/ai/chat
// Body: { message, history: [{role, content}], context: {subject, topic} }
const chat = async (req, res) => {
  try {
    const { provider, apiKey } = await getUserApiKey(req.user._id);
    const { message, history = [], context = {} } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'message is required' });

    // Limit history to last 10 turns to control token usage
    const trimmedHistory = history.slice(-10);
    const reply = await aiTutorService.askTutor(provider, apiKey, trimmedHistory, message, context);
    res.json({ success: true, data: { reply, provider } });
  } catch (err) {
    const status = err.code === 'NO_API_KEY' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message, code: err.code });
  }
};

// POST /api/ai/chat/stream — Server-Sent Events streaming chat
// Body: { message, history: [{role, content}], context: {subject, topic} }
// Emits: data: {"delta": "..."}\n\n  per chunk, then data: [DONE]\n\n
// On failure: data: {"error": "...", "isQuotaError": bool}\n\n then closes.
const chatStream = async (req, res) => {
  // SSE headers — must go out before any chunk is written, and before any
  // await that could throw, so the client always gets a well-formed stream.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering if present
  });
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  let clientClosed = false;
  req.on('close', () => { clientClosed = true; });

  try {
    const { provider, apiKey } = await getUserApiKey(req.user._id);
    const { message, history = [], context = {} } = req.body;
    if (!message?.trim()) {
      send({ error: 'message is required' });
      return res.end();
    }

    const trimmedHistory = history.slice(-10);

    await aiTutorService.streamTutorReply(
      provider,
      apiKey,
      trimmedHistory,
      message,
      context,
      (delta) => { if (!clientClosed) send({ delta }); }
    );

    if (!clientClosed) send({ done: true });
  } catch (err) {
    const normalized = err?.message !== undefined
      ? err
      : { message: 'AI request failed.', isQuotaError: false };
    if (!clientClosed) {
      send({
        error: normalized.message || 'AI request failed.',
        isQuotaError: !!normalized.isQuotaError,
        code: err?.code,
      });
    }
  } finally {
    if (!clientClosed) res.end();
  }
};

module.exports = { explainAnswer, verifyReasoning, generateQuestions, startGeneratedTest, chat, chatStream };