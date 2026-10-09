// v6: network-first for pages (so updates show immediately), cache-first only for hashed /assets/ files.
const V = 'fp-v6';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    if (/\/assets\//.test(r.url)) { const hit = await c.match(r); if (hit) return hit; }
    try { const x = await fetch(r); if (x.ok) c.put(r, x.clone()); return x; } catch (err) { const hit = await c.match(r); if (hit) return hit; throw err; }
  }));
});
