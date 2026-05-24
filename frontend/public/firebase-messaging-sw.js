// Firebase Messaging Service Worker
// This file must be in the public folder and named firebase-messaging-sw.js
// Note: Replace the firebaseConfig values with your actual Firebase config
// You can get these from Firebase Console > Project Settings > General

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// TODO: Replace these values with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYg_88rb8uFkNpS6Md2xbVw6kD5Sf5-8o",
  authDomain: "temari-go-3ba9a.firebaseapp.com",
  projectId: "temari-go-3ba9a",
  storageBucket: "temari-go-3ba9a.firebasestorage.app",
  messagingSenderId: "188875673348",
  appId: "1:188875673348:web:2a0964ded39daa53ca8a51",
  measurementId: "G-Y6D65SXZ8L"
};


firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});