const CACHE="step-level-app-v1";
const ASSETS=["./","./index.html","./test.html","./results.html","./support.html","./privacy.html","./terms.html","./404.html","./manifest.json","./assets/styles.css","./assets/app.js","./assets/site-data.js","./assets/test.js","./assets/results.js","./assets/support.js","./assets/questions.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res;}).catch(()=>cached)));
});