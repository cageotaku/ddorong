/* 또롱이 수첩 — 앱 화면을 폰에 저장해 두는 일꾼
 * 인터넷이 되면 항상 새 화면을 받아 오고(폰에 남은 예전 것은 쓰지 않아요), 안 되면 마지막에 받은 화면을 보여 줘요.
 * 구글 서버(기록·캘린더)와 글꼴 요청은 건드리지 않아요. */
const CACHE = 'ddorong-shell-v2';
const SHELL = ['./', './config.js?v=1', './manifest.webmanifest?v=1', './icon-180.png?v=1', './icon-192.png?v=1'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).catch(() => {}).then(() => self.skipWaiting()));
});
/* 예전 저장본(v1)은 지우고, 열려 있는 창은 한 번 새로 불러와서 바로 새 화면으로 바꿔요 */
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    if (old.length) {
      const wins = await self.clients.matchAll({ type: 'window' });
      for (const w of wins) { try { await w.navigate(w.url); } catch (err) { /* 넘어감 */ } }
    }
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  /* 화면 번호는 늘 서버에서 */
  if (url.pathname.endsWith('/version.json')) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  e.respondWith(
    fetch(page ? new Request(url.href, { cache: 'no-store', credentials: 'same-origin' }) : req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(page ? './' : req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(page ? './' : req).then((hit) => hit || (page ? caches.match('./') : undefined)))
  );
});
