// ========== PETFY - SERVICE WORKER ==========
const CACHE_NAME = 'petfy-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/css/petfy.css',
    '/assets/js/main.js',
    '/assets/img/petfy.png',
    '/assets/img/Group 1.png',
    '/tienda/',
    '/servicios/',
    '/contacto/',
    '/offline.html'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Cache abierto');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.log('❌ Error en cache:', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache viejo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Estrategia: Cache First, luego Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si está en cache, devolverlo
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Si no, ir a la red
                return fetch(event.request)
                    .then((response) => {
                        // Guardar en cache para futuro
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Si falla la red, mostrar página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});