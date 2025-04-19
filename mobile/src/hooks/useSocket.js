import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

// Create context
const SocketContext = createContext();

// API URL - Change this to your actual API URL
const API_URL = 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Socket.io client reference
  const socketRef = useRef(null);

  // Connect to WebSocket server
  useEffect(() => {
    if (user && token) {
      // Initialize socket connection with auth token
      socketRef.current = io(API_URL, {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Handle socket connection events
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Listen for messages
      socketRef.current.on('receive_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      // Listen for message sent confirmation
      socketRef.current.on('message_sent', (message) => {
        // Ensure we don't duplicate messages
        setMessages(prev => {
          if (!prev.some(m => m._id === message._id)) {
            return [...prev, message];
          }
          return prev;
        });
      });

      // Listen for user status changes
      socketRef.current.on('user_status', ({ userId, status }) => {
        setContacts(prev => 
          prev.map(contact => 
            contact._id === userId 
              ? { ...contact, status } 
              : contact
          )
        );
      });

      // Listen for typing indicators
      socketRef.current.on('user_typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping
        }));
      });

      // Listen for incoming calls
      socketRef.current.on('call_request', (callData) => {
        setIncomingCall(callData);
      });

      // Listen for call accepted
      socketRef.current.on('call_accepted', ({ call }) => {
        setActiveCall(call);
        setIncomingCall(null);
      });

      // Listen for call rejected
      socketRef.current.on('call_rejected', () => {
        setActiveCall(null);
      });

      // Listen for call ended
      socketRef.current.on('call_ended', () => {
        setActiveCall(null);
      });

      // Listen for call signals (WebRTC)
      socketRef.current.on('call_signal', (signalData) => {
        // This will be handled by the call screen component
        console.log('Call signal received', signalData);
      });

      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user, token]);

  // Load messages for a selected contact
  const loadMessages = useCallback(async (contactId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  }, [token]);

  // Load all contacts
  const loadContacts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to load contacts', error);
    }
  }, [token]);

  // Select a contact for chatting
  const selectContact = useCallback((contact) => {
    setSelectedContact(contact);
    if (contact) {
      loadMessages(contact._id);
    }
  }, [loadMessages]);

  // Send a message
  const sendMessage = useCallback((content, type = 'text', mediaUrl = '') => {
    if (!selectedContact || !socketRef.current) return;
    
    socketRef.current.emit('send_message', {
      receiverId: selectedContact._id,
      content,
      type,
      mediaUrl
    });
  }, [selectedContact]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (!selectedContact || !socketRef.current) return;
    
    socketRef.current.emit('typing', {
      receiverId: selectedContact._id,
      isTyping
    });
  }, [selectedContact]);

  // Initiate a call
  const initiateCall = useCallback((receiverId, type = 'audio') => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('call_request', {
      receiverId,
      type
    });
  }, []);

  // Accept an incoming call
  const acceptCall = useCallback((callId, callerId) => {
    if (!socketRef.current || !incomingCall) return;
    
    socketRef.current.emit('call_accept', {
      callId,
      callerId
    });
  }, [incomingCall]);

  // Reject an incoming call
  const rejectCall = useCallback((callId, callerId) => {
    if (!socketRef.current || !incomingCall) return;
    
    socketRef.current.emit('call_reject', {
      callId,
      callerId
    });
    
    setIncomingCall(null);
  }, [incomingCall]);

  // End an active call
  const endCall = useCallback((callId, participantId) => {
    if (!socketRef.current || !activeCall) return;
    
    socketRef.current.emit('call_end', {
      callId,
      participantId
    });
    
    setActiveCall(null);
  }, [activeCall]);

  // Send WebRTC signaling data
  const sendCallSignal = useCallback((receiverId, signal, type) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('call_signal', {
      receiverId,
      signal,
      type
    });
  }, []);

  // Create context value
  const value = {
    connected,
    contacts,
    messages,
    selectedContact,
    incomingCall,
    activeCall,
    typingUsers,
    loadContacts,
    selectContact,
    sendMessage,
    sendTyping,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    sendCallSignal,
    socket: socketRef.current
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};