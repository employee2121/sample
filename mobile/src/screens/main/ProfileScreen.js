import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Avatar, Button, TextInput, Text, Switch, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

const ProfileScreen = () => {
  const { user, logout, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    setLoading(true);
    
    try {
      // Basic validation
      if (!name.trim()) {
        throw new Error('Name cannot be empty');
      }
      
      if (email !== user.email) {
        if (!/\S+@\S+\.\S+/.test(email)) {
          throw new Error('Email address is invalid');
        }
      }
      
      // Check if passwords need to be updated
      if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) {
          throw new Error('Current password is required to change password');
        }
        
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
        
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }
      }
      
      // Prepare profile data
      const profileData = {
        name,
        ...(email !== user.email && { email }),
        ...(newPassword && currentPassword && { 
          currentPassword,
          newPassword
        }),
        settings: {
          notifications: notificationsEnabled,
          darkMode: darkModeEnabled
        }
      };
      
      await updateProfile(profileData);
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK' }]
      );
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: logout,
          style: 'destructive'
        }
      ]
    );
  };
  
  // Generate avatar initials
  const getInitials = (userName) => {
    if (!userName) return '?';
    return userName.split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={100} 
          label={getInitials(user?.name)}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        
        <TextInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry={secureCurrentPassword}
          right={
            <TextInput.Icon
              icon={secureCurrentPassword ? "eye" : "eye-off"}
              onPress={() => setSecureCurrentPassword(!secureCurrentPassword)}
            />
          }
        />
        
        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry={secureNewPassword}
          right={
            <TextInput.Icon
              icon={secureNewPassword ? "eye" : "eye-off"}
              onPress={() => setSecureNewPassword(!secureNewPassword)}
            />
          }
        />
        
        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry={secureConfirmPassword}
          right={
            <TextInput.Icon
              icon={secureConfirmPassword ? "eye" : "eye-off"}
              onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
            />
          }
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color="#666" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            color="#4A90E2"
          />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon-outline" size={24} color="#666" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            color="#4A90E2"
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleProfileUpdate}
          style={styles.updateButton}
          loading={loading}
          disabled={loading}
        >
          Update Profile
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          disabled={loading}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  avatar: {
    backgroundColor: '#4A90E2',
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 10,
  },
  buttonContainer: {
    margin: 15,
    marginBottom: 30,
  },
  updateButton: {
    marginBottom: 15,
    paddingVertical: 8,
  },
  logoutButton: {
    paddingVertical: 8,
  },
});

export default ProfileScreen;