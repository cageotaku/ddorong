/* 또롱이 수첩 — 앱 화면을 폰에 저장해 두는 일꾼
 * 인터넷이 되면 항상 새 화면을 받아 오고, 안 되면 저장해 둔 화면을 보여 줘요.
 * 구글 서버(기록·캘린더)와 글꼴 요청은 건드리지 않아요. */
const CACHE = 'ddorong-shell-v1';
const SHELL = ['./', './index.html', './config.js?v=1', './manifest.webmanifest?v=1', './icon-180.png?v=1', './icon-192.png?v=1'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
