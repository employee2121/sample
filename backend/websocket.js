const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Call = require('./models/Call');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_key';

// Connected users map
const connectedUsers = new Map();

const setupWebSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      
      next();
    } catch (error) {
      console.error(`WebSocket authentication error: ${error.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Store user connection
    connectedUsers.set(socket.user._id.toString(), socket);
    
    // Update user status to online
    await User.findByIdAndUpdate(socket.user._id, { status: 'online' });
    
    // Broadcast user status to all connected users
    io.emit('user_status', {
      userId: socket.user._id,
      status: 'online'
    });
    
    // Handle text message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, type = 'text', mediaUrl = '' } = data;
        
        if (!receiverId || !content) {
          return socket.emit('error', { message: 'Receiver ID and content are required' });
        }
        
        // Save message to database
        const newMessage = new Message({
          sender: socket.user._id,
          receiver: receiverId,
          content,
          type,
          mediaUrl
        });
        
        const savedMessage = await newMessage.save();
        
        // Populate sender and receiver info
        await savedMessage.populate('sender', 'name avatar email');
        await savedMessage.populate('receiver', 'name avatar email');
        
        // Send message to receiver if online
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          receiverSocket.emit('receive_message', savedMessage);
        }
        
        // Send confirmation to sender
        socket.emit('message_sent', savedMessage);
      } catch (error) {
        console.error(`Error sending message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      
      if (!receiverId) return;
      
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit('user_typing', {
          userId: socket.user._id,
          isTyping
        });
      }
    });
    
    // Handle call signaling
    socket.on('call_signal', (data) => {
      const { receiverId, signal, type } = data;
      
      if (!receiverId || !signal) return;
      
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit('call_signal', {
          callerId: socket.user._id,
          callerName: socket.user.name,
          callerAvatar: socket.user.avatar,
          signal,
          type
        });
      }
    });
    
    // Handle call events (request, accept, reject, end)
    socket.on('call_request', async (data) => {
      try {
        const { receiverId, type = 'audio' } = data;
        
        if (!receiverId) return;
        
        // Create call record
        const newCall = new Call({
          caller: socket.user._id,
          receiver: receiverId,
          type
        });
        
        const call = await newCall.save();
        
        // Send to receiver if online
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          receiverSocket.emit('call_request', {
            call,
            callerId: socket.user._id,
            callerName: socket.user.name,
            callerAvatar: socket.user.avatar,
            type
          });
        }
      } catch (error) {
        console.error(`Error processing call request: ${error.message}`);
      }
    });
    
    socket.on('call_accept', async (data) => {
      try {
        const { callId, callerId } = data;
        
        if (!callId || !callerId) return;
        
        // Update call status
        const call = await Call.findByIdAndUpdate(
          callId,
          { status: 'ongoing', startTime: new Date() },
          { new: true }
        );
        
        // Send to caller if online
        const callerSocket = connectedUsers.get(callerId);
        if (callerSocket) {
          callerSocket.emit('call_accepted', { call });
        }
      } catch (error) {
        console.error(`Error accepting call: ${error.message}`);
      }
    });
    
    socket.on('call_reject', async (data) => {
      try {
        const { callId, callerId } = data;
        
        if (!callId || !callerId) return;
        
        // Update call status
        const call = await Call.findByIdAndUpdate(
          callId,
          { status: 'rejected', endTime: new Date() },
          { new: true }
        );
        
        // Send to caller if online
        const callerSocket = connectedUsers.get(callerId);
        if (callerSocket) {
          callerSocket.emit('call_rejected', { call });
        }
      } catch (error) {
        console.error(`Error rejecting call: ${error.message}`);
      }
    });
    
    socket.on('call_end', async (data) => {
      try {
        const { callId, participantId } = data;
        
        if (!callId || !participantId) return;
        
        // Get the call
        const call = await Call.findById(callId);
        
        if (!call) return;
        
        // Update call status
        const endTime = new Date();
        const durationMs = endTime - call.startTime;
        const durationSeconds = Math.floor(durationMs / 1000);
        
        await Call.findByIdAndUpdate(
          callId,
          { 
            status: 'completed', 
            endTime, 
            duration: durationSeconds 
          }
        );
        
        // Send to other participant if online
        const participantSocket = connectedUsers.get(participantId);
        if (participantSocket) {
          participantSocket.emit('call_ended', { callId });
        }
      } catch (error) {
        console.error(`Error ending call: ${error.message}`);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.user._id.toString());
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.user._id, { status: 'offline' });
      
      // Broadcast user status to all connected users
      io.emit('user_status', {
        userId: socket.user._id,
        status: 'offline'
      });
    });
  });

  return io;
};

module.exports = setupWebSocket;