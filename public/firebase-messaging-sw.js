// Firebase Messaging Service Worker for Background Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDCi-Yk7ChqFaFz7Fkwxkj1W5rrZ0fxwaA",
  authDomain: "laughing-pod-9v4kj.firebaseapp.com",
  projectId: "laughing-pod-9v4kj",
  storageBucket: "laughing-pod-9v4kj.firebasestorage.app",
  messagingSenderId: "372456414206",
  appId: "1:372456414206:web:056ba5f09762ffe0003eaf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background push notification:', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'TuitionPlatform Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'tuition-alert',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
