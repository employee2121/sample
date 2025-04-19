import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// API URL - Change this to your actual API URL
const API_URL = 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedToken) {
          setToken(storedToken);
          
          // Set auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Get user profile
          const { data } = await axios.get(`${API_URL}/auth/profile`);
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Register user
  const register = async (name, email, password) => {
    setError(null);
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Save token to storage
      await AsyncStorage.setItem('token', data.token);
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      return data;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Save token to storage
      await AsyncStorage.setItem('token', data.token);
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      return data;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call logout API (if needed)
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Remove token from storage
      await AsyncStorage.removeItem('token');
      
      // Remove auth header
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear state
      setToken(null);
      setUser(null);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put(`${API_URL}/users/profile`, profileData);
      setUser(data);
      return data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
      throw error;
    }
  };

  // Create auth provider value
  const value = {
    user,
    token,
    isLoading,
    error,
    register,
    login,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};