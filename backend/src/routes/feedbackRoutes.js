const router = require('express').Router();
const { submitFeedback, getStats, getAllFeedback } = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats',  getStats);                          // public — landing page
router.post('/',      protect, submitFeedback);           // auth required
router.get('/admin',  protect, adminOnly, getAllFeedback); // admin only

module.exports = router;