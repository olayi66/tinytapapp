const C='tinytaps-v4';
const SHELL=['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  const save=r=>{ if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp)).catch(()=>{});} return r; };
  // Voices and icons rarely change: use the saved copy first.
  if(/\/voices\/|icon-\d+\.png$/.test(url.pathname)){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(save)));
    return;
  }
  // Everything else: get the newest version, fall back to the saved one when offline or slow.
  e.respondWith(new Promise(resolve=>{
    let done=false; const fallback=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'));
    const t=setTimeout(()=>fallback().then(r=>{ if(r&&!done){done=true;resolve(r);} }),3500);
    fetch(req).then(save).then(r=>{ clearTimeout(t); if(!done){done=true;resolve(r);} })
      .catch(()=>fallback().then(r=>{ clearTimeout(t); if(!done){done=true;resolve(r||Response.error());} }));
  }));
});
