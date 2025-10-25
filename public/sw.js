// 🎵 Kodini Tools Service Worker v2 - Sony 80s Retro PWA Ready! 🖼️
const CACHE_VERSION = 'kodini-tools-v2';
const BASE_PATH = '/ultimativermusikplayer/';

// Assets die gecacht werden sollen - mit korrekten Pfaden
const STATIC_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  // Manifest und Icons
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
];

// Installation: Cache erstellen
self.addEventListener('install', (event) => {
  console.log('🚀 Kodini Tools SW: Installation gestartet');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('📦 Kodini Tools SW: Cache geöffnet');
        // Versuche Assets zu cachen, aber fehle nicht wenn einzelne nicht verfügbar sind
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ Konnte ${url} nicht cachen:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('✅ Kodini Tools SW: Installation erfolgreich');
        // Sofort aktivieren
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Kodini Tools SW: Installation fehlgeschlagen', error);
      })
  );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('🔄 Kodini Tools SW: Aktivierung gestartet');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_VERSION)
            .map((cacheName) => {
              console.log('🗑️ Kodini Tools SW: Lösche alten Cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Kodini Tools SW: Aktivierung erfolgreich');
        // Übernehme sofort die Kontrolle über alle Clients
        return self.clients.claim();
      })
  );
});

// Fetch: Network-first für HTML, Cache-first für Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Nur für gleiche Origin
  if (url.origin !== location.origin && !url.origin.includes('fonts.googleapis.com')) {
    return;
  }

  // Network-first für HTML (immer aktuelle Version)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone für Cache
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback auf Cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first für alle anderen Assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Nicht im Cache, hole vom Netzwerk
        return fetch(event.request)
          .then((response) => {
            // Nur erfolgreiche Responses cachen
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Clone für Cache
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseClone);
            });
            
            return response;
          })
          .catch((error) => {
            console.error('❌ Fetch fehlgeschlagen:', error);
            // Hier könnte eine Offline-Seite zurückgegeben werden
            return new Response('Offline - Bitte Internetverbindung prüfen', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message Handler für Client-Kommunikation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_VERSION).then(() => {
        console.log('🗑️ Cache geleert');
      })
    );
  }
});

console.log('🎵 Kodini Tools Service Worker geladen v2 - Sony 80s Retro PWA Ready! 🖼️');
