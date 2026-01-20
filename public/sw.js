const CACHE_NAME = 'mapa-360-v2'; // Incrementado para limpiar cache viejo
const STATIC_CACHE = 'mapa-360-static-v2';
const DYNAMIC_CACHE = 'mapa-360-dynamic-v2';

const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos estáticos');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forzar activación inmediata
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar todos los caches que no sean la versión actual
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Tomar control inmediatamente
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // NUNCA cachear llamadas a la API - siempre ir a la red
  if (url.pathname.startsWith('/api/')) {
    console.log('Service Worker: Bypass cache para API:', url.pathname);
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Si falla la red, devolver respuesta de error
          return new Response(
            JSON.stringify({ error: 'Sin conexión' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Para recursos estáticos: Cache First, Network Fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico)$/) ||
    url.pathname === '/' ||
    url.pathname === '/login' ||
    url.pathname === '/dashboard' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Sirviendo desde cache:', url.pathname);
            // Actualizar cache en background
            fetch(request).then(response => {
              if (response && response.status === 200) {
                caches.open(STATIC_CACHE).then(cache => cache.put(request, response.clone()));
              }
            });
            return cachedResponse;
          }

          // Si no está en cache, ir a la red
          return fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          });
        })
    );
    return;
  }

  // Para todo lo demás: Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        return caches.match(request);
      })
  );
});