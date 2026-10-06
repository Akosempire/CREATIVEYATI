export function safeNext(value, fallback="/learn") {
 const path=String(value||"");
 if(!path.startsWith("/")||path.startsWith("//")||/[\\\x00-\x20]/.test(path))return fallback;
 try { const url=new URL(path,"https://local.invalid"); return url.origin==="https://local.invalid" ? url.pathname+url.search+url.hash : fallback; } catch { return fallback; }
}
