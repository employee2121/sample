const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/:userId', getMessages);
router.post('/', sendMessage);
router.delete('/:id', deleteMessage);

module.exports = router;