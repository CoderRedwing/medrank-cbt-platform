const User        = require('../models/User');
const TestSession = require('../models/TestSession');
const LiveTest    = require('../models/LiveTest');
const {
  getFullPaperIndex,
  getSubjectPaperIndex,
  getTopicBankIndex,
  getLiveTestPaperIndex,
  loadLiveTestPaper,
  loadFullPaper,
  loadSubjectPaper,
  loadTopicBank,
  DATASET_PATH,
} = require('../config/dataset');
const fs   = require('fs');
const path = require('path');

// ─── GET /api/admin/stats ─────────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTests,
      testsToday,
      activeNow,
      newThisWeek,
      avgAccuracyAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      TestSession.countDocuments({ status: 'submitted' }),
      TestSession.countDocuments({
        status: 'submitted',
        createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) },
      }),
      TestSession.countDocuments({ status: 'in_progress' }),
      User.countDocuments({
        role: 'student',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      TestSession.aggregate([
        { $match: { status: 'submitted' } },
        { $group: { _id: null, avg: { $avg: '$accuracy' } } },
      ]),
    ]);

    // Registrations over last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const regTrend = await User.aggregate([
      { $match: { role: 'student', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Tests per day last 30 days
    const testTrend = await TestSession.aggregate([
      { $match: { status: 'submitted', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most-attempted papers
    const popularPapers = await TestSession.aggregate([
      { $match: { status: 'submitted' } },
      { $group: { _id: '$paper_ref', title: { $first: '$paper_title' }, count: { $sum: 1 }, avgAccuracy: { $avg: '$accuracy' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Subject popularity
    const subjectStats = await TestSession.aggregate([
      { $match: { status: 'submitted' } },
      { $unwind: { path: '$responses', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$responses.subject', correct: { $sum: { $cond: ['$responses.is_correct', 1, 0] } }, total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 19 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalTests,
          testsToday,
          activeNow,
          newThisWeek,
          avgAccuracy: Math.round(avgAccuracyAgg[0]?.avg || 0),
        },
        regTrend,
        testTrend,
        popularPapers,
        subjectStats: subjectStats.map((s) => ({
          subject:  s._id,
          total:    s.total,
          correct:  s.correct,
          accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        })),
        dataset: {
          fullPapers:    getFullPaperIndex().length,
          subjectPapers: getSubjectPaperIndex().length,
          topicBanks:    getTopicBankIndex().length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/students ──────────────────────────────────────
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 30, search = '', sort = '-createdAt' } = req.query;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = search
      ? { role: 'student', $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : { role: 'student' };

    const [students, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('name email targetExam stats createdAt lastActive'),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { students, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/students/:id ──────────────────────────────────
const getStudentDetail = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const tests = await TestSession.find({ user: req.params.id, status: 'submitted' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('test_type paper_title score accuracy correct_count total_questions createdAt time_taken_sec');

    res.json({ success: true, data: { student, recentTests: tests } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/admin/students/:id ────────────────────────────────
const updateStudent = async (req, res) => {
  try {
    const allowed = ['name', 'email', 'targetExam', 'role'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const student = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/students/:id ───────────────────────────────
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      TestSession.deleteMany({ user: req.params.id }),
    ]);

    res.json({ success: true, message: 'Student and all test data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/tests ─────────────────────────────────────────
const getAllTests = async (req, res) => {
  try {
    const { page = 1, limit = 30, type, status = 'submitted', userId } = req.query;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = { status };
    if (type)   filter.test_type = type;
    if (userId) filter.user      = userId;

    const [sessions, total] = await Promise.all([
      TestSession.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('user test_type paper_title score accuracy correct_count total_questions createdAt time_taken_sec status')
        .populate('user', 'name email'),
      TestSession.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { sessions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/tests/:id ──────────────────────────────────
const deleteTest = async (req, res) => {
  try {
    const session = await TestSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: 'Test session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/papers ────────────────────────────────────────
const listPapers = async (req, res) => {
  try {
    const { type = 'full' } = req.query;
    let index;
    if (type === 'full')    index = getFullPaperIndex();
    else if (type === 'subject') index = getSubjectPaperIndex();
    else                    index = getTopicBankIndex();
    res.json({ success: true, data: index });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/papers/:type/:id ─────────────────────────────
const getPaperDetail = async (req, res) => {
  try {
    const { type, id } = req.params;
    let paper;
    if (type === 'full')    paper = loadFullPaper(id);
    else if (type === 'subject') paper = loadSubjectPaper(id);
    else                    paper = loadTopicBank(id);
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });
    res.json({ success: true, data: paper });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/admin/papers/:type/:id/question ──────────────────
// Edit a single question within a paper JSON file
const editQuestion = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { question_id, updates } = req.body;

    if (!question_id || !updates) {
      return res.status(400).json({ success: false, message: 'question_id and updates required' });
    }

    // Load paper
    let folder, paper;
    if (type === 'full')         { folder = 'full_papers';    paper = loadFullPaper(id); }
    else if (type === 'subject') { folder = 'subject_papers'; paper = loadSubjectPaper(id); }
    else                         { folder = 'topic_wise';     paper = loadTopicBank(id); }

    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    const qKey = paper.questions ? 'questions' : 'questions';
    const qIdx = paper[qKey].findIndex((q) => q.question_id === question_id);
    if (qIdx === -1) return res.status(404).json({ success: false, message: 'Question not found' });

    // Allowed fields to update
    const allowedFields = ['question_text', 'options', 'correct_answer', 'explanation', 'difficulty', 'topic', 'subtopic'];
    allowedFields.forEach((f) => {
      if (updates[f] !== undefined) paper[qKey][qIdx][f] = updates[f];
    });

    // Validate correct_answer is in options
    const opts = paper[qKey][qIdx].options;
    const ca   = paper[qKey][qIdx].correct_answer;
    if (opts && ca && !opts[ca]) {
      return res.status(400).json({ success: false, message: `correct_answer "${ca}" not in options` });
    }

    // Write back to file
    const filePath = path.join(DATASET_PATH, folder, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(paper, null, 2), 'utf8');

    res.json({ success: true, data: paper[qKey][qIdx], message: 'Question updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/papers/:type/:id/question ───────────────────
// Add a new question to a paper
const addQuestion = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { question } = req.body;

    if (!question) return res.status(400).json({ success: false, message: 'question object required' });

    let folder, paper;
    if (type === 'full')         { folder = 'full_papers';    paper = loadFullPaper(id); }
    else if (type === 'subject') { folder = 'subject_papers'; paper = loadSubjectPaper(id); }
    else                         { folder = 'topic_wise';     paper = loadTopicBank(id); }

    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    // Validate
    const required = ['question_text', 'options', 'correct_answer', 'subject'];
    for (const f of required) {
      if (!question[f]) return res.status(400).json({ success: false, message: `Field "${f}" is required` });
    }
    if (!question.options[question.correct_answer]) {
      return res.status(400).json({ success: false, message: 'correct_answer must be A, B, C, or D' });
    }

    // Stamp
    const { v4: uuidv4 } = require('uuid');
    const newQ = {
      question_id:     question.question_id || `ADMIN_${uuidv4().slice(0,8).toUpperCase()}`,
      paper_type:      paper.paper_type || type,
      paper_ref:       id,
      subject:         question.subject,
      topic:           question.topic || 'General',
      subtopic:        question.subtopic || null,
      difficulty:      question.difficulty || 'Moderate',
      question_type:   'single_best_answer',
      image_based:     false,
      marks_correct:   4,
      marks_incorrect: -1,
      marks_unanswered:0,
      question_text:   question.question_text,
      options:         question.options,
      correct_answer:  question.correct_answer,
      explanation:     question.explanation || '',
    };

    paper.questions.push(newQ);
    paper.total_questions = paper.questions.length;

    const filePath = path.join(DATASET_PATH, type === 'full' ? 'full_papers' : type === 'subject' ? 'subject_papers' : 'topic_wise', `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(paper, null, 2), 'utf8');

    res.status(201).json({ success: true, data: newQ, message: 'Question added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/papers/:type/:id/question/:qid ─────────────
const deleteQuestion = async (req, res) => {
  try {
    const { type, id, qid } = req.params;

    let folder, paper;
    if (type === 'full')         { folder = 'full_papers';    paper = loadFullPaper(id); }
    else if (type === 'subject') { folder = 'subject_papers'; paper = loadSubjectPaper(id); }
    else                         { folder = 'topic_wise';     paper = loadTopicBank(id); }

    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    const before = paper.questions.length;
    paper.questions = paper.questions.filter((q) => q.question_id !== qid);
    if (paper.questions.length === before) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    paper.total_questions = paper.questions.length;

    const filePath = path.join(DATASET_PATH, folder, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(paper, null, 2), 'utf8');

    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/create-admin ─────────────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const admin = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({ success: true, data: admin, message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/announcements (placeholder) ───────────────────
const getAnnouncements = async (req, res) => {
  res.json({ success: true, data: [] });
};

// ─── Live Test scheduling ──────────────────────────────────────────

// GET /api/admin/live-tests/papers — dataset papers available to schedule
const listLiveTestPapers = async (req, res) => {
  try {
    const data = getLiveTestPaperIndex();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/live-tests — all scheduled live tests
const getLiveTests = async (req, res) => {
  try {
    const tests = await LiveTest.find().sort({ starts_at: -1 });
    res.json({ success: true, data: tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/live-tests — schedule a new live test
const createLiveTest = async (req, res) => {
  try {
    const { paper_ref, starts_at, ends_at } = req.body;
    if (!paper_ref || !starts_at || !ends_at) {
      return res.status(400).json({ success: false, message: 'paper_ref, starts_at and ends_at are required' });
    }

    const start = new Date(starts_at);
    const end   = new Date(ends_at);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ success: false, message: 'ends_at must be after starts_at' });
    }

    const paper = loadLiveTestPaper(paper_ref);
    if (!paper) {
      return res.status(404).json({ success: false, message: `Paper ${paper_ref} not found in dataset` });
    }

    const existing = await LiveTest.findOne({ paper_ref });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This paper is already scheduled. Edit or delete the existing schedule instead.' });
    }

    const liveTest = await LiveTest.create({
      paper_ref,
      paper_title: paper.paper_title,
      starts_at:   start,
      ends_at:     end,
      status:      start > new Date() ? 'upcoming' : 'live',
    });

    // Notify every student that a new live quiz has been scheduled.
    // Never let a notification failure block the scheduling itself.
    try {
      const { notifyManyUsers } = require('../services/notificationService');
      const students = await User.find({ role: 'student' }).select('_id');
      if (students.length) {
        await notifyManyUsers(students.map((s) => s._id), {
          type: 'live_test',
          title: 'New Live Quiz Scheduled',
          body: `${paper.paper_title} — starts ${start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}. Register before it fills up!`,
          link: '/live-test',
        });
      }
    } catch (notifyErr) {
      console.warn('Failed to broadcast live-test notification:', notifyErr.message);
    }

    res.status(201).json({ success: true, data: liveTest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/live-tests/:id — reschedule / update
const updateLiveTest = async (req, res) => {
  try {
    const allowed = ['starts_at', 'ends_at', 'status'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (updates.starts_at) updates.starts_at = new Date(updates.starts_at);
    if (updates.ends_at)   updates.ends_at   = new Date(updates.ends_at);

    const liveTest = await LiveTest.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!liveTest) return res.status(404).json({ success: false, message: 'Scheduled live test not found' });

    res.json({ success: true, data: liveTest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/live-tests/:id
const deleteLiveTest = async (req, res) => {
  try {
    const liveTest = await LiveTest.findByIdAndDelete(req.params.id);
    if (!liveTest) return res.status(404).json({ success: false, message: 'Scheduled live test not found' });
    res.json({ success: true, message: 'Live test schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPlatformStats,
  getStudents,
  getStudentDetail,
  updateStudent,
  deleteStudent,
  getAllTests,
  deleteTest,
  listPapers,
  getPaperDetail,
  editQuestion,
  addQuestion,
  deleteQuestion,
  createAdmin,
  getAnnouncements,
  listLiveTestPapers,
  getLiveTests,
  createLiveTest,
  updateLiveTest,
  deleteLiveTest,
};