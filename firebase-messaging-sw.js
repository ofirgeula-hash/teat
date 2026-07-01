importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyB-sa9xR6DxdYv6DCAUn1Ze1Kzb6TMuxzA",
  authDomain:        "shopping-list-db6a8.firebaseapp.com",
  projectId:         "shopping-list-db6a8",
  storageBucket:     "shopping-list-db6a8.firebasestorage.app",
  messagingSenderId: "722011046106",
  appId:             "1:722011046106:web:0734fe777690e1270265e3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const notification = payload.notification || {};
  const title = notification.title || 'תזכורת משימות';
  const body  = notification.body  || '';
  self.registration.showNotification(title, {
    body,
    icon:  '/teat/icon-192.png',
    badge: '/teat/icon-192.png',
    dir:   'rtl',
    lang:  'he',
    data:  { url: payload.fcmOptions?.link || '/teat/' },
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/teat/';
  e.waitUntil(clients.openWindow(url));
});
