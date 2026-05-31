const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  explainAnswer,
  verifyReasoning,
  generateQuestions,
  startGeneratedTest,
  chat,
} = require('../controllers/aiTutorController');

// All AI routes require auth
router.use(protect);

router.post('/explain',            explainAnswer);
router.post('/verify-reasoning',   verifyReasoning);
router.post('/generate',           generateQuestions);
router.post('/start-generated-test', startGeneratedTest);
router.post('/chat',               chat);

module.exports = router;
