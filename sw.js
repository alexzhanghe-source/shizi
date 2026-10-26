/* Hanzi Bear service worker: app shell + dictionary data offline; stroke bundles cached when first used. */
var VERSION = 'hb-v1.1.0';
var SHELL = 'hb-shell-' + VERSION, STROKES = 'hb-strokes-v2';
var CORE = ['./', 'index.html', 'css/app.css', 'js/i18n.js', 'js/ai-config.js', 'js/dict.js', 'js/hw.js', 'js/ai.js', 'js/voice.js', 'js/bear.js', 'js/app.js',
  'vendor/hanzi-writer.min.js', 'vendor/hanzilookup.min.js', 'data/chars.json', 'data/words.json', 'data/mmah.json', 'manifest.webmanifest', 'audio/silence.mp3',
  'img/icons/icon-192.png', 'img/icons/apple-touch-icon.png', 'img/bear/cheer.webp', 'img/bear/happy.webp', 'img/bear/idle.webp', 'img/bear/jump.webp', 'img/bear/love.webp', 'img/bear/sing.webp', 'img/bear/think.webp'];
var OPTIONAL = ['config.js', 'img/icons/icon-512.png', 'img/icons/favicon-32.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return c.addAll(CORE).then(function () { return Promise.all(OPTIONAL.map(function (u) { return c.add(u).catch(function () { }); })); });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return (k.indexOf('hb-shell-') === 0 && k !== SHELL) || k === 'hb-strokes-v1'; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // proxy calls go straight to the network
  if (url.pathname.indexOf('/data/sb/') >= 0) {
    e.respondWith(caches.open(STROKES).then(function (c) {
      return c.match(req).then(function (hit) { return hit || fetch(req).then(function (r) { if (r.ok) c.put(req, r.clone()); return r; }); });
    }));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) { var cp = r.clone(); caches.open(SHELL).then(function (c) { c.put('index.html', cp); }); return r; }).catch(function () { return caches.match('index.html', { ignoreSearch: true }); }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (r) { if (r.ok && /\.(js|css|webp|png|json|mp3|webmanifest)$/.test(url.pathname)) { var cp = r.clone(); caches.open(SHELL).then(function (c) { c.put(req, cp); }); } return r; });
  }));
});
