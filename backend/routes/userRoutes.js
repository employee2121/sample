const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserStatus, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/status', updateUserStatus);
router.put('/profile', updateUserProfile);

module.exports = router;