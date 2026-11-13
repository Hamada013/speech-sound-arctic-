/* The whole app offline. Installing caches every small file (offline-release.js, built by scripts/build-offline.cjs);
   the recordings and videos are cached by the home page's «حفظ دون إنترنت» (message DOWNLOAD) or the first time each
   plays. الكلمات and the test keep their own workers; they look in these caches too before the network. */
importScripts('./offline-release.js');
const R = self.OFFLINE_RELEASE, BASE = self.registration.scope;
const SHELL = `articulation-app:${BASE}:shell:${R.version}`, MEDIA = `articulation-app:${BASE}:media`, OLD = `articulation-app:${BASE}:shell:`;
const abs = url => new URL(url, BASE).href;
const shell = new Set(R.shell.map(abs)), media = new Map(R.media.map(([url, size]) => [abs(url), size]));
const keyOf = request => { const url = new URL(request.url); url.search = ''; url.hash = ''; if (url.pathname.endsWith('/')) url.pathname += 'index.html'; return url.href; };

async function fill(cache, urls, each) {
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      if (await cache.match(url)) { each?.(); continue; }
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok || response.redirected) throw Error(`تعذّر تنزيل ${url}`);
      await cache.put(url, response);
      each?.();
    }
  }));
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(SHELL), old = (await caches.keys()).find(name => name.startsWith(OLD) && name !== SHELL);
  /* Files that did not change come from the previous version's cache. */
  if (old) { const previous = await caches.open(old); for (const url of shell) { const hit = await previous.match(url); if (hit) await cache.put(url, hit); } }
  try { await fill(cache, [...shell]); } catch (error) { await caches.delete(SHELL); throw error; }
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(OLD) && name !== SHELL) await caches.delete(name);
  const cache = await caches.open(MEDIA);
  for (const request of await cache.keys()) if (!media.has(request.url)) await cache.delete(request);
  await self.clients.claim();
})()));

/* Videos and recordings asked in parts (Safari) get the part they asked for. */
async function ranged(response, range) {
  const data = await response.arrayBuffer(), match = /^bytes=(\d*)-(\d*)$/.exec(range || '');
  if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${data.byteLength}` } });
  let start = match[1] ? Number(match[1]) : Math.max(0, data.byteLength - Number(match[2]));
  const end = Math.min(match[1] && match[2] ? Number(match[2]) : data.byteLength - 1, data.byteLength - 1);
  if (start > end) start = end;
  return new Response(data.slice(start, end + 1), { status: 206, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream', 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${data.byteLength}` } });
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const key = keyOf(request);
  if (shell.has(key)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL), hit = await cache.match(key);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok && !response.redirected) await cache.put(key, response.clone());
      return response;
    })());
    return;
  }
  if (media.has(key)) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA);
      let hit = await cache.match(key);
      if (!hit) {
        const response = await fetch(key);
        if (!response.ok) return response;
        await cache.put(key, response.clone()).catch(() => {});
        hit = response;
      }
      return request.headers.has('Range') ? ranged(hit, request.headers.get('Range')) : hit;
    })().catch(() => new Response(null, { status: 504 })));
  }
});

/* STATUS: how many recordings and videos are saved. DOWNLOAD: save the rest, reporting progress. */
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(MEDIA), have = new Set((await cache.keys()).map(r => r.url)), urls = [...media.keys()];
      const saved = urls.filter(url => have.has(url)).length;
      if (event.data?.type === 'STATUS') { port.postMessage({ saved, total: urls.length, version: R.version, bytes: R.bytes }); return; }
      if (event.data?.type === 'DOWNLOAD') {
        let done = saved, last = 0;
        await fill(cache, urls.filter(url => !have.has(url)), () => { done++; const now = Date.now(); if (now - last > 250 || done === urls.length) { last = now; port.postMessage({ saved: done, total: urls.length }); } });
        port.postMessage({ saved: urls.length, total: urls.length, complete: true });
      }
    } catch (error) { port.postMessage({ error: error.name === 'QuotaExceededError' ? 'مساحة الجهاز غير كافية.' : 'انقطع التنزيل. اتصل بالإنترنت ثم أعد المحاولة؛ يكمل من حيث توقف.' }); }
  })());
});
