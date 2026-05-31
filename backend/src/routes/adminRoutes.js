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

module.exports = router;
