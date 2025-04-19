# Running the React Native Mobile App

## Prerequisites
- Node.js (version 14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For mobile testing: Expo Go app on iOS/Android device

## Installation Steps

1. Navigate to the mobile directory:
```
cd mobile
```

2. Install dependencies:
```
npm install
```
or
```
yarn install
```

3. Start the Expo development server:
```
npm start
```
or 
```
expo start
```

## Viewing the App

### On a physical device:
1. Download the Expo Go app from the App Store (iOS) or Google Play Store (Android)
2. Scan the QR code displayed in your terminal with the Expo Go app (Android) or Camera app (iOS)

### On an emulator:
1. Press 'a' in the terminal to open on Android emulator
2. Press 'i' in the terminal to open on iOS simulator (macOS only)

### On web:
1. Press 'w' in the terminal to open in a web browser

## API Connection
Make sure to update the API URL in the mobile app to point to your backend server:

- In `mobile/src/hooks/useAuth.js` and `mobile/src/hooks/useSocket.js`, update the `API_URL` constant:
```javascript 
const API_URL = 'http://your-server-ip:5001/api';
```

## MongoDB Connection
The app is configured to use MongoDB with the following connection string:
```
mongodb+srv://pankaj12:MM3d6FobKTaZ8pWs@cluster0.yvs1pu5.mongodb.net/VC
```

## Features Implemented

- User authentication (register, login, logout)
- Real-time messaging with typing indicators
- Voice and video calling with WebRTC
- User status indicators (online/offline)
- Profile management

This React Native app works in harmony with the Node.js backend to provide a cross-platform real-time communication experience.