/* Annes Recepten — service worker voor offline shell + assets.
 * Update CACHE_VERSION bij breaking changes om oude caches op te ruimen. */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `annes-recepten-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `annes-recepten-runtime-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/',
  '/lijst',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/erik-anne-drinks.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // addAll is atomic: valt 1 url, dan niks. Individueel proberen.
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              // Ignore missing pages (bijv. voor pin-niet-ingelogd)
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
      self.clients.claim(),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  // API-routes nooit cachen (WebAuthn, etc.)
  if (url.pathname.startsWith('/api/')) return
  // Pin-flow niet cachen
  if (url.pathname.startsWith('/pin')) return

  const isHtml =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')

  if (isHtml) {
    // Network-first: verse data bij online, cache-fallback bij offline
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
          }
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (match) =>
                match || caches.match('/lijst') || caches.match('/') || Response.error()
            )
        )
    )
    return
  }

  const isAsset =
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|ttf|png|jpe?g|gif|svg|webp|ico)$/.test(url.pathname)

  if (isAsset) {
    // Cache-first voor statische assets
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone()
              caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
            }
            return response
          })
          .catch(() => cached || Response.error())
      })
    )
    return
  }
})
