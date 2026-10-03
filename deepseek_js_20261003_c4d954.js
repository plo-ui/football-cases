// Service Worker для Футбольные Кейсы IDLE
const CACHE_NAME = 'football-idle-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png'
];

// Установка — кешируем все файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // Если какой-то файл не загрузился (например, иконки нет) — не падаем
        return cache.addAll(['./', './index.html']);
      });
    }).then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Запросы — отдаём из кеша, если есть; иначе из сети
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Не кешируем не-GET и внешние URL
        if (event.request.method !== 'GET' ||
            !event.request.url.startsWith(self.location.origin)) {
          return response;
        }
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        // Если совсем нет сети — отдаём index.html
        return caches.match('./index.html');
      });
    })
  );
});