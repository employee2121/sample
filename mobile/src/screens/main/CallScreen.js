import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Avatar, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { Audio, Video } from 'expo-av';

const CallScreen = ({ route, navigation }) => {
  const { contactId, contactName, isVideo = false } = route.params;
  const { user } = useAuth();
  const { initiateCall, acceptCall, rejectCall, endCall, incomingCall, activeCall, sendCallSignal } = useSocket();
  
  // Call state
  const [callState, setCallState] = useState('connecting'); // connecting, ringing, ongoing, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  
  // Refs
  const callTimerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  // Handle creating the WebRTC peer connection
  useEffect(() => {
    const setupCall = async () => {
      try {
        // Check for permissions first (would be implemented in a real app)
        
        // Start the call
        if (!incomingCall) {
          // This is an outgoing call
          setCallState('ringing');
          initiateCall(contactId, isVideo ? 'video' : 'audio');
        } else {
          // This is an incoming call - accept it
          setCallState('ongoing');
          acceptCall(incomingCall.call._id, incomingCall.callerId);
          startCallTimer();
        }
      } catch (error) {
        console.error('Failed to setup call:', error);
        Alert.alert(
          'Call Error',
          'Failed to establish call connection. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };
    
    setupCall();
    
    // Cleanup on unmount
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      
      // Clean up WebRTC resources
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);
  
  // Start call timer
  const startCallTimer = () => {
    if (callTimerRef.current) return;
    
    const startTime = new Date();
    callTimerRef.current = setInterval(() => {
      const diffMs = new Date() - startTime;
      setCallDuration(Math.floor(diffMs / 1000));
    }, 1000);
  };
  
  // Format call duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  // Handle call control buttons
  const handleEndCall = () => {
    if (activeCall) {
      endCall(activeCall._id, contactId);
    }
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    navigation.goBack();
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    
    // In a real app, you would switch to speaker here
    // For Expo apps, this could be done with the expo-av library:
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !isSpeakerOn,
      });
    }
  };
  
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };
  
  // Call status component
  const CallStatus = () => {
    switch (callState) {
      case 'connecting':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.statusText}>Connecting...</Text>
          </View>
        );
      case 'ringing':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Ringing...</Text>
          </View>
        );
      case 'ongoing':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {formatDuration(callDuration)}
            </Text>
          </View>
        );
      case 'ended':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Call ended</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      {isVideoEnabled ? (
        <View style={styles.videoContainer}>
          {/* Remote video would be displayed here */}
          <View style={styles.remoteVideo} />
          
          {/* Local video thumbnail */}
          <View style={styles.localVideo} />
        </View>
      ) : (
        <View style={styles.audioContainer}>
          <Avatar.Text 
            size={150} 
            label={contactName.substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
          <Text style={styles.contactName}>{contactName}</Text>
          <CallStatus />
        </View>
      )}
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.activeButton]}
          onPress={toggleMute}
        >
          <Ionicons 
            name={isMuted ? "mic-off" : "mic-outline"} 
            size={28} 
            color="#fff" 
          />
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>
        
        {isVideo && (
          <TouchableOpacity
            style={[styles.controlButton, !isVideoEnabled && styles.activeButton]}
            onPress={toggleVideo}
          >
            <Ionicons 
              name={isVideoEnabled ? "videocam-outline" : "videocam-off-outline"} 
              size={28} 
              color="#fff" 
            />
            <Text style={styles.controlLabel}>
              {isVideoEnabled ? 'Hide Video' : 'Show Video'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.controlButton, isSpeakerOn && styles.activeButton]}
          onPress={toggleSpeaker}
        >
          <Ionicons 
            name={isSpeakerOn ? "volume-high-outline" : "volume-medium-outline"} 
            size={28} 
            color="#fff" 
          />
          <Text style={styles.controlLabel}>
            {isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={28} color="#fff" />
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    backgroundColor: '#444',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatar: {
    backgroundColor: '#4A90E2',
    marginBottom: 20,
  },
  contactName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  statusText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeButton: {
    backgroundColor: '#4A90E2',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
  controlLabel: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
});

export default CallScreen;