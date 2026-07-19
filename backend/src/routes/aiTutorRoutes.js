const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  explainAnswer,
  verifyReasoning,
  generateQuestions,
  startGeneratedTest,
  chat,
  chatStream,
} = require('../controllers/aiTutorController');

// All AI routes require auth
router.use(protect);

router.post('/explain',            explainAnswer);
router.post('/verify-reasoning',   verifyReasoning);
router.post('/generate',           generateQuestions);
router.post('/start-generated-test', startGeneratedTest);
router.post('/chat',               chat);
router.post('/chat/stream',        chatStream);

module.exports = router;