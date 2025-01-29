/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Take control immediately
clientsClaim();
self.skipWaiting();

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache other assets
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

const button = document.getElementById("notifications");
button?.addEventListener("click", () => {
  Notification.requestPermission().then((result) => {
    if (result === "granted") {
      randomNotification();
    }
  });
});

function randomNotification() {
  new Notification("Hello World");
  setTimeout(randomNotification, 30000);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus on existing window or open new one
  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    // Try to find an existing window
    const existingWindow = windowClients.find(client => 
      client.url === event.notification.data?.url
    );

    if (existingWindow) {
      return existingWindow.focus();
    }

    // If no existing window, open new one
    if (event.notification.data?.url) {
      return self.clients.openWindow(event.notification.data.url);
    }
  })());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options: NotificationOptions = {
      body: data.body,
      icon: '/note-maskable.png',
      badge: '/note-maskable.png',
      data: data.data,
      tag: data.tag || 'default',
      requireInteraction: true,
      silent: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event.notification);
}); 