const express = require('express');
const router = express.Router();
const {
  login,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;