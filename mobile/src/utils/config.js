// App Configuration
const config = {
  // API Backend URL
  apiUrl: 'http://localhost:5001/api', // Change this to your server IP for testing on physical devices
  
  // WebSocket URL
  wsUrl: 'ws://localhost:5001', // Change this to your server IP for testing on physical devices
  
  // Authentication
  authTokenName: 'auth_token',
  
  // App Theme
  theme: {
    primary: '#4A90E2',
    accent: '#5C6BC0',
    background: '#F5F7FB',
    text: '#333333',
    placeholder: '#9B9B9B',
    surface: '#FFFFFF',
    error: '#FF3B30'
  },
  
  // API Keys for External Services
  videoSDK: {
    apiKey: 'c82edd71-1865-458e-87ad-92eb0f98d783',
    secretKey: '9cee5297b35e1b14c27f836a8e3b9c85f4d3ef33dd3ed0ebfffafc5070cd4061'
  },
  
  // Connection Retry Configuration
  connection: {
    maxRetries: 5,
    retryDelay: 1000
  }
};

export default config;