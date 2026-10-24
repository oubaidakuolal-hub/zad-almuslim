'use strict';

const CACHE_NAME = 'zad-obaidah-v7';
const ASSETS = [
  './',
  './index.html',
  './wird.html',
  './adhkar.html',
  './azkar-morning.html',
  './azkar-evening.html',
  './nawawi.html',
  './quran.html',
  './articles.html',
  './about.html',
  './assets/style.css',
  './assets/data.js',
  './assets/app.js',
  './logo-zad-almuslim.webp.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        ASSETS.map(url => cache.add(url).catch(() => console.warn('فشل تخزين:', url)))
      ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return response;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
