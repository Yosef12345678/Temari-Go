import type { ExpoConfig } from 'expo/config';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const GOOGLE_MAPS_WEB_URL = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_URL || 'https://maps.google.com';
const IOS_GOOGLE_MAPS_API_KEY = process.env.IOS_GOOGLE_MAPS_API_KEY || '';
const ANDROID_GOOGLE_MAPS_API_KEY = process.env.ANDROID_GOOGLE_MAPS_API_KEY || '';

const config: ExpoConfig = {
  name: 'Temari-Go-Driver',
  slug: 'Temari-Go-Driver',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'temarigodriver',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.davie10.driver',
    icon: './assets/images/icon.png',
    config: {
      googleMapsApiKey: IOS_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    package: 'com.davie10.driver',
    googleServicesFile: './google-services.json',
    permissions: ['POST_NOTIFICATIONS'],
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: ANDROID_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    API_BASE_URL,
    GOOGLE_MAPS_WEB_URL,
    GOOGLE_MAPS_IOS_CONFIGURED: Boolean(IOS_GOOGLE_MAPS_API_KEY),
    GOOGLE_MAPS_ANDROID_CONFIGURED: Boolean(ANDROID_GOOGLE_MAPS_API_KEY),
    eas: {
      projectId: '184f25e5-e6d6-42d1-8864-e7bfbe00d6b1',
    },
  },
};

export default config;
