const express = require('express');
const router = express.Router();
const { startCall, updateCallStatus, getCallHistory, getCallById } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/', startCall);
router.put('/:id', updateCallStatus);
router.get('/', getCallHistory);
router.get('/:id', getCallById);

module.exports = router;