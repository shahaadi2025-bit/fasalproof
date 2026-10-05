const V = 'fp-v5';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => { const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => { const hit = await c.match(r); const net = fetch(r).then(x => { if (x.ok) c.put(r, x.clone()); return x; }).catch(() => hit); return hit || net; })); });
