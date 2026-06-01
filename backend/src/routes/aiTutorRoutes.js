const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  explainAnswer,
  verifyReasoning,
  generateQuestions,
  startGeneratedTest,
  chat,
} = require('../controllers/aiTutorController');

// Temporary: AI features under development
router.use((req, res) => {
  res.status(503).json({
    success: false,
    message: "We're currently working on AI features. We'll update you soon!",
  });
});

// All AI routes require auth
router.use(protect);

router.post('/explain',            explainAnswer);
router.post('/verify-reasoning',   verifyReasoning);
router.post('/generate',           generateQuestions);
router.post('/start-generated-test', startGeneratedTest);
router.post('/chat',               chat);

module.exports = router;
