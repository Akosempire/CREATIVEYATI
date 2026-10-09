import "server-only";
import { streamVideoId } from "./stream-reference";

export function streamConfigured() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN);
}

export async function streamRequest(path, options = {}) {
  if (!streamConfigured()) throw new Error("Cloudflare Stream is not configured.");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream${path}`, {
    ...options, cache: "no-store", signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`, ...options.headers },
  });
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new Error("Cloudflare denied Stream access. Verify that Stream is enabled for the configured account and that the Vercel token has Stream Read and Edit access. No Supabase fallback was used.");
    throw new Error(`Cloudflare Stream is unavailable (${response.status}). Check Stream storage capacity and retry.`);
  }
  return response;
}

export async function streamJson(path, body) {
  const response = await streamRequest(path, body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success || !data.result) throw new Error("Cloudflare could not complete the video request.");
  return data.result;
}

export async function streamPlayback(db, key, courseId, download = false) {
  const uid = streamVideoId(key);
  const { data: asset } = await db.from("media_assets").select("id,duration_seconds").eq("course_id", courseId).eq("storage_key", key).eq("bucket", "cloudflare-stream").eq("processing_status", "ready").maybeSingle();
  if (!uid || !asset) throw new Error("This video is not ready for playback.");
  const video = await streamJson(`/${uid}`);
  if (!video.readyToStream || !video.requireSignedURLs) throw new Error("Protected video playback is not ready.");
  const manifest = new URL(video.playback.hls);
  if (manifest.protocol !== "https:" || !(/(^|\.)(cloudflarestream\.com|videodelivery\.net)$/.test(manifest.hostname))) throw new Error("Invalid playback host.");
  if (download) {
    const result = await streamJson(`/${uid}/downloads`, {});
    if (result.default?.status !== "ready") throw new Error("Your download is being prepared. Try again shortly.");
  }
  const { token } = await streamJson(`/${uid}/token`, {
    exp: Math.floor(Date.now() / 1000) + Math.min(86400, Math.max(3600, (asset.duration_seconds || 0) + 1800)),
    downloadable: download,
  });
  return `${manifest.origin}/${token}/${download ? "downloads/default.mp4" : "manifest/video.m3u8"}`;
}
