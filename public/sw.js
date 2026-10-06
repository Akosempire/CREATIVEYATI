// Retire shared authenticated caches until offline storage has account-bound
// entitlement expiry and correct byte-range support. Normal downloads still work.
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
async function purge() {
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith("cy-shell-")||key.startsWith("cy-media-")).map(key=>caches.delete(key)));
}
self.addEventListener("activate",event=>event.waitUntil((async()=>{await purge();await self.clients.claim();})()));
self.addEventListener("message",event=>{if(event.data==="purge-cache")event.waitUntil(purge());});
// Deliberately no fetch interception: access is rechecked by the server.

