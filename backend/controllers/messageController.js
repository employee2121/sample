const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.userId;
    
    // Check if the receiver user exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }
    
    // Find messages where (sender is current user AND receiver is param userId)
    // OR (sender is param userId AND receiver is current user)
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar');
    
    // Mark all messages from the other user as read
    await Message.updateMany(
      { sender: receiverId, receiver: senderId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    
    res.status(200).json(messages);
  } catch (error) {
    console.error(`Error in getMessages: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = 'text', mediaUrl = '' } = req.body;
    
    // Validate required fields
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    // Check if the receiver user exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }
    
    // Create a new message
    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      type,
      mediaUrl
    });
    
    // Save the message
    const message = await newMessage.save();
    
    // Populate sender and receiver info
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');
    
    res.status(201).json(message);
  } catch (error) {
    console.error(`Error in sendMessage: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if the user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }
    
    await Message.deleteOne({ _id: req.params.id });
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(`Error in deleteMessage: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};