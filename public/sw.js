const CACHE = 'screentime-v1'
const STATIC = ['/log', '/offline']

// Install — cache les pages essentielles
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

// Activate — supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch — network first, fallback cache
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // API calls → toujours network, jamais cache
  if (url.pathname.startsWith('/api/')) return

  e.respondWith(
    fetch(request)
      .then(res => {
        // Met en cache les pages navigables
        if (request.mode === 'navigate') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request).then(r => r || caches.match('/offline')))
  )
})