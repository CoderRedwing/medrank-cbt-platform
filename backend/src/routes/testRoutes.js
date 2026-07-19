const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  listPapers, startTest, saveResponse, submitTest,
  getHistory, getSession, getAnalysis,
  getLiveTest, startLiveTest, submitLiveTest, registerLiveTest,
} = require('../controllers/testController');

router.get('/papers',                   protect, listPapers);
router.get(
    "/live",
    protect,
    getLiveTest
);

router.post(
    "/live/register",
    protect,
    registerLiveTest
);

router.post(
    "/live/start",
    protect,
    startLiveTest
);

router.post(
    "/live/submit/:sessionId",
    protect,
    submitLiveTest
);
router.post('/start',                   protect, startTest);
router.get('/history',                  protect, getHistory);
router.get('/:sessionId',               protect, getSession);
router.get('/:sessionId/analysis',      protect, getAnalysis);
router.patch('/:sessionId/response',    protect, saveResponse);
router.post('/:sessionId/submit',       protect, submitTest);

module.exports = router;