const User = require('../models/User');
const TestSession = require('../models/TestSession');
const { EXAM_WEIGHTAGE } = require('../services/analysisEngine');

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // User stats
    const user = await User.findById(userId);

    // Recent 5 tests
    const recentTests = await TestSession.find({ user: userId, status: 'submitted' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('test_type paper_title score accuracy correct_count total_questions createdAt time_taken_sec');

    // Score trend (last 10 tests)
    const scoreTrend = await TestSession.find({ user: userId, status: 'submitted' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('score accuracy createdAt paper_title test_type');

    // Subject performance summary
    const subjectPerf = {};
    const subjectSessions = await TestSession.find({ user: userId, status: 'submitted' })
      .select('subject_analysis');

    subjectSessions.forEach((s) => {
      const sa = Object.fromEntries(s.subject_analysis || new Map());
      Object.entries(sa).forEach(([subj, data]) => {
        if (!subjectPerf[subj]) subjectPerf[subj] = { correct: 0, attempted: 0 };
        subjectPerf[subj].correct  += data.correct || 0;
        subjectPerf[subj].attempted += data.attempted || 0;
      });
    });

    // Add accuracy + weightage to each subject
    const subjectSummary = Object.entries(subjectPerf).map(([subject, data]) => ({
      subject,
      accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
      attempted: data.attempted,
      correct: data.correct,
      weightage: EXAM_WEIGHTAGE[subject] || 1,
    })).sort((a, b) => b.weightage - a.weightage);

    // Top weak areas
    const weakAreas = subjectSummary
      .filter((s) => s.attempted >= 5 && s.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Strongest subjects
    const strongAreas = subjectSummary
      .filter((s) => s.attempted >= 5 && s.accuracy >= 70)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        user: {
          name:          user.name,
          email:         user.email,
          targetExam:    user.targetExam,
          stats:         user.stats,
          memberSince:   user.createdAt,
        },
        recentTests,
        scoreTrend: scoreTrend.reverse(), // oldest first for chart
        subjectSummary,
        weakAreas,
        strongAreas,
        totalTestsSubmitted: await TestSession.countDocuments({ user: userId, status: 'submitted' }),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };
