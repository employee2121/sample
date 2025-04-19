import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import { IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

const ChatDetailScreen = ({ route, navigation }) => {
  const { id: contactId, name: contactName } = route.params;
  const { user } = useAuth();
  const { messages, sendMessage, selectContact, typingUsers, sendTyping } = useSocket();
  const [isSending, setIsSending] = useState(false);
  const theme = useTheme();
  
  // Update navigation header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: contactName,
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="video"
            size={24}
            onPress={() => handleVideoCall()}
            color={theme.colors.primary}
          />
          <IconButton
            icon="phone"
            size={24}
            onPress={() => handleVoiceCall()}
            color={theme.colors.primary}
          />
        </View>
      ),
    });
  }, [navigation, contactName]);
  
  // Format messages for GiftedChat
  const formattedMessages = messages.map(msg => ({
    _id: msg._id,
    text: msg.content,
    createdAt: new Date(msg.timestamp),
    user: {
      _id: msg.sender,
      name: msg.sender === user._id ? user.name : contactName,
      avatar: msg.sender === user._id ? user.avatar : null,
    },
    sent: true,
    received: msg.sender !== user._id,
  })).sort((a, b) => b.createdAt - a.createdAt);
  
  // Handle sending a message
  const handleSend = useCallback((messages = []) => {
    setIsSending(true);
    
    const [message] = messages;
    
    try {
      sendMessage(message.text);
      // Stop typing indicator when sending message
      sendTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [sendMessage, sendTyping]);
  
  // Handle initiating a voice call
  const handleVoiceCall = () => {
    navigation.navigate('Call', { 
      contactId,
      contactName,
      isVideo: false
    });
  };
  
  // Handle initiating a video call
  const handleVideoCall = () => {
    navigation.navigate('Call', { 
      contactId,
      contactName,
      isVideo: true
    });
  };
  
  // Handle typing indicator
  const handleInputTextChanged = (text) => {
    sendTyping(text.length > 0);
  };
  
  // Customize chat bubbles
  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: theme.colors.primary,
          },
          left: {
            backgroundColor: '#E8E8E8',
          }
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
          },
          left: {
            color: '#333333',
          }
        }}
      />
    );
  };
  
  // Customize input toolbar
  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
      />
    );
  };
  
  // Customize send button
  const renderSend = (props) => {
    return (
      <Send
        {...props}
        disabled={props.text.trim().length === 0}
        containerStyle={styles.sendContainer}
      >
        {isSending ? (
          <ActivityIndicator size={24} color={theme.colors.primary} />
        ) : (
          <Ionicons name="send" size={24} color={theme.colors.primary} />
        )}
      </Send>
    );
  };
  
  // Show typing indicator
  const renderFooter = () => {
    if (typingUsers[contactId]) {
      return (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDotMiddle]} />
            <View style={styles.typingDot} />
          </View>
        </View>
      );
    }
    return null;
  };
  
  return (
    <View style={styles.container}>
      <GiftedChat
        messages={formattedMessages}
        onSend={handleSend}
        user={{
          _id: user._id,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderFooter={renderFooter}
        onInputTextChanged={handleInputTextChanged}
        alwaysShowSend
        scrollToBottom
        scrollToBottomComponent={() => (
          <IconButton
            icon="chevron-down"
            size={30}
            color={theme.colors.primary}
            style={styles.scrollToBottom}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  headerRight: {
    flexDirection: 'row',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  sendContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  scrollToBottom: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  typingContainer: {
    padding: 10,
  },
  typingBubble: {
    backgroundColor: '#E8E8E8',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 70,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingDotMiddle: {
    opacity: 0.8,
  },
});

export default ChatDetailScreen;