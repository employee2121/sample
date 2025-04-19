import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Context Providers
import { AuthProvider } from './src/hooks/useAuth';
import { SocketProvider } from './src/hooks/useSocket';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',
    accent: '#5C6BC0',
    background: '#F5F7FB',
    text: '#333333',
    placeholder: '#9B9B9B',
    surface: '#FFFFFF'
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <SocketProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </SocketProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}