const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    // Find all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ name: 1 });
    
    res.status(200).json(users);
  } catch (error) {
    console.error(`Error in getUsers: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(`Error in getUserById: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status
// @route   PUT /api/users/status
// @access  Private
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        status,
        lastActive: Date.now()
      },
      { new: true }
    ).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(`Error in updateUserStatus: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update basic fields
    user.name = req.body.name || user.name;
    
    // Update email if provided and different
    if (req.body.email && req.body.email !== user.email) {
      // Check if email is already in use
      const emailExists = await User.findOne({ email: req.body.email });
      
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      
      user.email = req.body.email;
    }
    
    // Update settings if provided
    if (req.body.settings) {
      user.settings = {
        ...user.settings,
        ...req.body.settings
      };
    }
    
    // Update password if provided
    if (req.body.currentPassword && req.body.newPassword) {
      // Verify current password
      const isMatch = await user.matchPassword(req.body.currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Set new password
      user.password = req.body.newPassword;
    }
    
    // Save updated user
    const updatedUser = await user.save();
    
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      status: updatedUser.status,
      settings: updatedUser.settings
    });
  } catch (error) {
    console.error(`Error in updateUserProfile: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};