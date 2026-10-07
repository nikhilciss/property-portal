import fs from 'node:fs';
const assets = fs.readdirSync('dist/assets').map((name) => '/assets/' + name);
const version = 'property-portal-' + Date.now();
fs.writeFileSync(
  'dist/sw.js',
  `const CACHE=${JSON.stringify(version)};const FILES=${JSON.stringify(['/', '/index.html', '/icon.svg', '/manifest.webmanifest', ...assets])};self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting()});self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('property-portal-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')))}else{event.respondWith(caches.match(event.request,{ignoreVary:true}).then(cached=>cached||fetch(event.request)))}});`,
);
