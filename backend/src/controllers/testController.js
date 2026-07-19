const testService = require('../services/testService');

// GET /api/tests/papers
const listPapers = async (req, res) => {
  try {
    const data = await testService.listAvailablePapers(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tests/live
const getLiveTest = async (req, res) => {
  try {
    const data = await testService.getActiveLiveTest(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tests/live/start
const startLiveTest = async (req, res) => {
  try {
    const session = await testService.createLiveTestSession(req.user._id);

    res.status(201).json({
      success: true,
      data: session
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// POST /api/tests/live/register
const registerLiveTest = async (req, res) => {
  try {
    const result = await testService.registerForLiveTest(req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/tests/live/submit/:sessionId
const submitLiveTest = async (req, res) => {

  try {

    const { responses, time_taken_sec } = req.body;

    const result = await testService.submitLiveTest(
      req.params.sessionId,
      req.user._id,
      responses,
      time_taken_sec
    );

    res.json({
      success: true,
      data: result
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message
    });

  }

};

// POST /api/tests/start
// Body: { test_type, paper_ref, questionCount?, difficulty? }
const startTest = async (req, res) => {
  try {
    const { test_type, paper_ref, questionCount, difficulty } = req.body;
    if (!test_type || !paper_ref) {
      return res.status(400).json({ success: false, message: 'test_type and paper_ref are required' });
    }
    const session = await testService.createTestSession(req.user._id, {
      test_type, paper_ref, questionCount
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error("DEBUG - START TEST FAILED:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/tests/:sessionId/response
// Body: { question_id, selected_answer, student_reason, time_spent_sec, marked_review }
const saveResponse = async (req, res) => {
  try {
    const { question_id, ...data } = req.body;
    if (!question_id) {
      return res.status(400).json({ success: false, message: 'question_id required' });
    }
    const result = await testService.saveResponse(
      req.params.sessionId, req.user._id, question_id, data
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/tests/:sessionId/submit
// Body: { responses: [...], time_taken_sec }
const submitTest = async (req, res) => {
  try {
    const { responses, time_taken_sec } = req.body;
    const session = await testService.submitTest(
      req.params.sessionId, req.user._id, responses, time_taken_sec
    );
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/tests/history?page=1&limit=20
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await testService.getUserTestHistory(
      req.user._id, parseInt(page), parseInt(limit)
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tests/:sessionId
const getSession = async (req, res) => {
  try {
    const session = await testService.getSessionDetail(req.params.sessionId, req.user._id);
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// GET /api/tests/:sessionId/analysis
// Returns detailed analysis (same as session but formatted for frontend)
const getAnalysis = async (req, res) => {
  try {
    const session = await testService.getSessionDetail(req.params.sessionId, req.user._id);
    if (session.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Test not yet submitted' });
    }

      const needsBackfill = session.responses.some(r => !r.question_text);
    if (needsBackfill) {
      const { loadFullPaper, loadSubjectPaper, loadTopicBank } = require('../config/dataset');
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
        console.warn('Backfill failed:', e.message);
      }
      const qMap = {};
      sourceQuestions.forEach(q => { qMap[q.question_id] = q; });

      session.responses = session.responses.map(r => {
        const q = qMap[r.question_id];
        return {
          ...r._doc,
          question_text: r.question_text || q?.question_text || 'Question not available',
          options:       r.options?.A ? r.options : (q?.options || {}),
          explanation:   r.explanation  || q?.explanation  || 'No explanation available',

          // ─── Image-based question support ───────────────────────────
          is_image_based: r.is_image_based ?? q?.is_image_based ?? q?.image_based ?? false,
          image_url:      r.image_url   || q?.image_url   || '',
          image_title:    r.image_title || q?.image_title || '',
          key_findings:   (r.key_findings && r.key_findings.length) ? r.key_findings : (q?.key_findings || []),
        };
      });
    }
    
    res.json({
      success: true,
      data: {
        session_id:          session._id,
        test_type:           session.test_type,
        paper_title:         session.paper_title,
        submitted_at:        session.submitted_at,
        time_taken_sec:      session.time_taken_sec,
        duration_allowed_sec: session.duration_allowed_sec,
        total_questions:     session.total_questions,
        score:               session.score,
        correct_count:       session.correct_count,
        incorrect_count:     session.incorrect_count,
        unattempted_count:   session.unattempted_count,
        accuracy:            session.accuracy,
        subject_analysis:    Object.fromEntries(session.subject_analysis || new Map()),
        topic_analysis:      Object.fromEntries(session.topic_analysis || new Map()),
        difficulty_analysis: Object.fromEntries(session.difficulty_analysis || new Map()),
        weak_subjects:       session.weak_subjects,
        weak_topics:         session.weak_topics,
        focus_suggestions:   session.focus_suggestions,
        responses:           session.responses,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listPapers, getLiveTest,
  startLiveTest,
  registerLiveTest,
  submitLiveTest, startTest, saveResponse, submitTest,
  getHistory, getSession, getAnalysis,
};