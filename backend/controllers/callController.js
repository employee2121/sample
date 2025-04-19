const Call = require('../models/Call');
const User = require('../models/User');

// @desc    Start a new call
// @route   POST /api/calls
// @access  Private
exports.startCall = async (req, res) => {
  try {
    const { receiverId, type = 'audio' } = req.body;
    
    // Validate inputs
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    // Validate call type
    if (!['audio', 'video'].includes(type)) {
      return res.status(400).json({ message: 'Invalid call type' });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Check if there's already an active call between these users
    const activeCall = await Call.findOne({
      $or: [
        { caller: req.user._id, receiver: receiverId },
        { caller: receiverId, receiver: req.user._id }
      ],
      status: { $in: ['initiated', 'ongoing'] }
    });
    
    if (activeCall) {
      return res.status(400).json({ 
        message: 'There is already an active call between these users',
        call: activeCall
      });
    }
    
    // Create a new call
    const newCall = new Call({
      caller: req.user._id,
      receiver: receiverId,
      type,
      mediaSettings: {
        audioEnabled: true,
        videoEnabled: type === 'video',
        speakerEnabled: false
      }
    });
    
    const call = await newCall.save();
    
    // Populate caller and receiver details
    await call.populate('caller', 'name avatar');
    await call.populate('receiver', 'name avatar');
    
    res.status(201).json(call);
  } catch (error) {
    console.error(`Error in startCall: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update call status
// @route   PUT /api/calls/:id
// @access  Private
exports.updateCallStatus = async (req, res) => {
  try {
    const { status, mediaSettings } = req.body;
    const callId = req.params.id;
    
    // Find the call
    const call = await Call.findById(callId);
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    // Verify the user is part of this call
    if (
      call.caller.toString() !== req.user._id.toString() && 
      call.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized to update this call' });
    }
    
    // Update status if provided
    if (status) {
      // Validate status
      if (!['initiated', 'ongoing', 'completed', 'missed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid call status' });
      }
      
      call.status = status;
      
      // Update start time if call is now ongoing
      if (status === 'ongoing' && !call.startTime) {
        call.startTime = Date.now();
      }
      
      // Update end time and calculate duration if call is completed or rejected
      if (['completed', 'rejected', 'missed'].includes(status) && !call.endTime) {
        call.endTime = Date.now();
        
        // Calculate duration for completed calls
        if (status === 'completed' && call.startTime) {
          const durationMs = call.endTime - call.startTime;
          call.duration = Math.floor(durationMs / 1000); // Convert to seconds
        }
      }
    }
    
    // Update media settings if provided
    if (mediaSettings) {
      call.mediaSettings = {
        ...call.mediaSettings,
        ...mediaSettings
      };
    }
    
    // Save the updated call
    const updatedCall = await call.save();
    
    // Populate caller and receiver details
    await updatedCall.populate('caller', 'name avatar');
    await updatedCall.populate('receiver', 'name avatar');
    
    res.status(200).json(updatedCall);
  } catch (error) {
    console.error(`Error in updateCallStatus: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get call history for a user
// @route   GET /api/calls
// @access  Private
exports.getCallHistory = async (req, res) => {
  try {
    // Get calls where the user is either the caller or receiver
    const calls = await Call.find({
      $or: [
        { caller: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 }) // Most recent first
    .populate('caller', 'name avatar')
    .populate('receiver', 'name avatar');
    
    res.status(200).json(calls);
  } catch (error) {
    console.error(`Error in getCallHistory: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific call by ID
// @route   GET /api/calls/:id
// @access  Private
exports.getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('caller', 'name avatar')
      .populate('receiver', 'name avatar');
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    // Verify the user is part of this call
    if (
      call.caller._id.toString() !== req.user._id.toString() && 
      call.receiver._id.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized to view this call' });
    }
    
    res.status(200).json(call);
  } catch (error) {
    console.error(`Error in getCallById: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};