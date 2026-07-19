const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, updateMe, logout , forgotPassword, resetPassword, saveApiKey, removeApiKey, setActiveApiKeyProvider} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Shared validators
const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  // FIX: stronger password requirement
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const forgotPasswordValidator = [
  body('email')
    .isEmail()
    .withMessage('Valid email required'),
];

const resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];


router.post(
  '/forgot-password',
  forgotPasswordValidator,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  resetPasswordValidator,
  resetPassword
);
router.post('/register', registerValidators, register);
router.post('/login',    loginValidators,    login);
router.post('/logout',   protect,            logout);   // FIX: real logout
router.get('/me',        protect,            getMe);
router.patch('/me',      protect,            updateMe);
router.post('/api-key',         protect,     saveApiKey);
router.patch('/api-key/active', protect,     setActiveApiKeyProvider);
router.delete('/api-key/:provider', protect, removeApiKey);

module.exports = router;