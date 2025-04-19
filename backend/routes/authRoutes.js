const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;