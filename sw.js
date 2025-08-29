// Nome do cache (altere se fizer mudanças grandes nos assets)
const CACHE_NAME = 'presenca-v1';

// Recursos que queremos disponíveis offline
const ASSETS = [
  './',
  './index.html',
  'https://unpkg.com/html5-qrcode', // biblioteca do leitor (via CDN)
  'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap'
];

// Instalação: cacheia os assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
    )).then(() => self.clients.claim())
  );
});

// Estratégia simples: cache-first para GET (útil p/ rodar offline depois da 1ª visita)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só GET entra na estratégia de cache
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Clona e salva no cache respostas de sucesso simples (mesmo de CDN)
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
        return res;
      }).catch(() => {
        // Sem cache e sem rede -> falha silenciosa
        return cached || new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
