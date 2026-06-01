const User = require('../models/User');
const TestSession = require('../models/TestSession');
const { EXAM_WEIGHTAGE } = require('../services/analysisEngine');

// In-memory dashboard cache
const dashboardCache = new Map();

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 min
const MAX_CACHE_SIZE = 1000;

const invalidateDashboardCache = (userId) => {
  dashboardCache.delete(String(userId));
};

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const now = Date.now();

    const cached = dashboardCache.get(userId);

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheAgeSec: Math.floor((now - cached.ts) / 1000),
      });
    }

    const [user, recentTests, scoreTrend, subjectSessions, totalTestsSubmitted] =
      await Promise.all([
        User.findById(userId).lean(),

        TestSession.find({
          user: userId,
          status: 'submitted',
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .select(
            'test_type paper_title score accuracy correct_count total_questions createdAt time_taken_sec'
          )
          .lean(),

        TestSession.find({
          user: userId,
          status: 'submitted',
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .select(
            'score accuracy createdAt paper_title test_type'
          )
          .lean(),

        TestSession.find({
          user: userId,
          status: 'submitted',
        })
          .select('subject_analysis')
          .lean(),

        TestSession.countDocuments({
          user: userId,
          status: 'submitted',
        }),
      ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const subjectPerf = {};

    subjectSessions.forEach((s) => {
      const sa =
        s.subject_analysis instanceof Map
          ? Object.fromEntries(s.subject_analysis)
          : (s.subject_analysis || {});

      Object.entries(sa).forEach(([subj, data]) => {
        if (!subjectPerf[subj]) {
          subjectPerf[subj] = {
            correct: 0,
            attempted: 0,
          };
        }

        subjectPerf[subj].correct += data.correct || 0;
        subjectPerf[subj].attempted += data.attempted || 0;
      });
    });

    const subjectSummary = Object.entries(subjectPerf)
      .map(([subject, data]) => ({
        subject,
        accuracy:
          data.attempted > 0
            ? Math.round((data.correct / data.attempted) * 100)
            : 0,
        attempted: data.attempted,
        correct: data.correct,
        weightage: EXAM_WEIGHTAGE[subject] || 1,
      }))
      .sort((a, b) => b.weightage - a.weightage);

    const weakAreas = subjectSummary
      .filter((s) => s.attempted >= 5 && s.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const strongAreas = subjectSummary
      .filter((s) => s.attempted >= 5 && s.accuracy >= 70)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    const data = {
      user: {
        name: user.name,
        email: user.email,
        targetExam: user.targetExam,
        stats: user.stats,
        memberSince: user.createdAt,
      },
      recentTests,
      scoreTrend: scoreTrend.reverse(),
      subjectSummary,
      weakAreas,
      strongAreas,
      totalTestsSubmitted,
    };

    if (dashboardCache.size > MAX_CACHE_SIZE) {
      dashboardCache.clear();
    }

    dashboardCache.set(userId, {
      ts: now,
      data,
    });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Dashboard Error:', err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getDashboard,
  invalidateDashboardCache,
};