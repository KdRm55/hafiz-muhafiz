/**
 * Hafız Muhafız — Service Worker (sw.js)
 * Tüm arayüzü ve Kur'an sayfalarını çevrimdışı hızlı yükleme için önbelleğe alır.
 */

const CACHE_VERSION = 'hafiz-muhafiz-v20';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;

// Kurulumda hemen önbelleğe alınacak yerel çekirdek dosyalar
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './audio-engine.js',
    './hafiz-engine.js',
    './quran-data.js',
    './offline-engine.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[ServiceWorker] Çekirdek varlıklar önbelleğe alınıyor...');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (
                        key !== STATIC_CACHE &&
                        key !== DYNAMIC_CACHE &&
                        key !== AUDIO_CACHE &&
                        key !== IMAGES_CACHE
                    ) {
                        console.log('[ServiceWorker] Eski önbellek siliniyor:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Ses Dosyaları (.mp3 / EveryAyah) -> Cache-First
    if (url.pathname.endsWith('.mp3') || url.hostname.includes('everyayah.com')) {
        event.respondWith(
            caches.open(AUDIO_CACHE).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (err) {
                    console.warn('[ServiceWorker] Ses çevrim dışıyken indirilemedi:', url.href);
                    throw err;
                }
            })
        );
        return;
    }

    // 2. Mushaf Sayfa Fotoğrafları (.jpg / .png / QuranHub / jsDelivr) -> Cache-First
    if (
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.png') ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('raw.githubusercontent.com')
    ) {
        event.respondWith(
            caches.open(IMAGES_CACHE).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (err) {
                    return cachedResponse || new Response('Görsel çevrim dışı', { status: 503 });
                }
            })
        );
        return;
    }

    // 3. Google Fonts & FontAwesome CDN -> Cache-First
    if (
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdnjs.cloudflare.com')
    ) {
        event.respondWith(
            caches.open(STATIC_CACHE).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (err) {
                    return cachedResponse;
                }
            })
        );
        return;
    }

    // 4. API İstekleri (alquran.cloud) -> Network-First with Cache Fallback
    if (url.hostname.includes('api.alquran.cloud')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then(async (cache) => {
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (err) {
                    const cachedResponse = await cache.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    throw err;
                }
            })
        );
        return;
    }

    // 5. Standart Statik Varlıklar & HTML Sayfası -> Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Ağ yoksa ve HTML isteniyorsa ana sayfayı döndür
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
