const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ── Platform stats
router.get('/stats', getPlatformStats);

// ── Students
router.get('/students',          getStudents);
router.get('/students/:id',      getStudentDetail);
router.patch('/students/:id',    updateStudent);
router.delete('/students/:id',   deleteStudent);

// ── Tests
router.get('/tests',             getAllTests);
router.delete('/tests/:id',      deleteTest);

// ── Papers & questions
router.get('/papers',                              listPapers);
router.get('/papers/:type/:id',                    getPaperDetail);
router.patch('/papers/:type/:id/question',         editQuestion);
router.post('/papers/:type/:id/question',          addQuestion);
router.delete('/papers/:type/:id/question/:qid',   deleteQuestion);

// ── Admin management
router.post('/create-admin',     createAdmin);
router.get('/announcements',     getAnnouncements);

// ── Live test scheduling
router.get('/live-tests/papers', listLiveTestPapers);
router.get('/live-tests',        getLiveTests);
router.post('/live-tests',       createLiveTest);
router.patch('/live-tests/:id',  updateLiveTest);
router.delete('/live-tests/:id', deleteLiveTest);

module.exports = router;
