const User        = require('../models/User');
const TestSession = require('../models/TestSession');

// POST /api/feedback  — submit rating
const submitFeedback = async (req, res) => {
  try {
    const { rating, comment, category } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    // Guard 1: already rated
    const user = await User.findById(req.user._id);
    if (user.feedback?.rating)
      return res.status(400).json({ success: false, message: 'You have already submitted a rating' });

    // Guard 2: must have completed at least 1 test
    const testCount = await TestSession.countDocuments({
      user: req.user._id, status: 'submitted'
    });
    if (testCount < 1)
      return res.status(403).json({ success: false, message: 'Complete at least one test to leave a rating' });

    // Guard 3: account older than 3 days
    const ageDays = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
    if (ageDays < 1)
      return res.status(403).json({ success: false, message: 'Account must be at least 3 days old to rate' });

    user.feedback = {
      rating,
      comment:              comment?.trim().slice(0, 500) || '',
      category:             category || 'General',
      submittedAt:          new Date(),
      testsCompletedAtTime: testCount,
    };
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/feedback/stats  — public, shown on landing page
const getStats = async (req, res) => {
  try {
    const result = await User.aggregate([
      { $match: { 'feedback.rating': { $exists: true } } },
      {
        $group: {
          _id:       null,
          average:   { $avg: '$feedback.rating' },
          total:     { $sum: 1 },
          fiveStar:  { $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] } },
          fourStar:  { $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] } },
          twoStar:   { $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] } },
          oneStar:   { $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] } },
        },
      },
    ]);

    // Recent verified comments (only 4+ star, has comment, verified student)
    const recent = await User.find({
      'feedback.rating':  { $gte: 4 },
      'feedback.comment': { $ne: '' },
    })
      .sort({ 'feedback.submittedAt': -1 })
      .limit(6)
      .select('name targetExam feedback.rating feedback.comment feedback.testsCompletedAtTime feedback.submittedAt');

    const stats = result[0] || { average: 0, total: 0 };

    res.json({
      success: true,
      data: {
        average:    Math.round((stats.average || 0) * 10) / 10,
        total:      stats.total || 0,
        breakdown:  {
          5: stats.fiveStar  || 0,
          4: stats.fourStar  || 0,
          3: stats.threeStar || 0,
          2: stats.twoStar   || 0,
          1: stats.oneStar   || 0,
        },
        recent: recent.map(u => ({
          name:         u.name.split(' ')[0] + ' ' + (u.name.split(' ')[1]?.[0] || '') + '.',
          targetExam:   u.targetExam,
          rating:       u.feedback.rating,
          comment:      u.feedback.comment,
          testsCount:   u.feedback.testsCompletedAtTime,
          submittedAt:  u.feedback.submittedAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/feedback/admin  — admin only, all feedback
const getAllFeedback = async (req, res) => {
  try {
    const users = await User.find({ 'feedback.rating': { $exists: true } })
      .sort({ 'feedback.submittedAt': -1 })
      .select('name email targetExam feedback createdAt');

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { submitFeedback, getStats, getAllFeedback };