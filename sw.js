// 離線快取：打包後的程式、幣種圖示、App 圖示檔名不會變，第二次打開直接用手機裡的，打開更快。
// 首頁和版本檔（index.html、version.json）一律走網路，才拿得到新版。
const CACHE = 'oxc-static-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  // 打開網頁（首頁）一律拿最新的，不用瀏覽器暫存（沒網路才用暫存）
  if (req.mode === 'navigate') { e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req).then(r => r || fetch(req)))); return; }
  if (!/\/(assets|coins|icons)\//.test(u.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) {
      c.put(req, res.clone());
      // 舊版本的檔案別一直堆：超過 400 個就清掉最早的 100 個
      c.keys().then(ks => { if (ks.length > 400) ks.slice(0, 100).forEach(k => c.delete(k)); });
    }
    return res;
  }));
});
