import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "@/lib/supabase/server") return { url: "data:text/javascript," + encodeURIComponent("export const getAdminUser=async()=>null;export const getStudentUser=async()=>globalThis.testStudent;export const createSupabaseServiceClient=()=>globalThis.testDatabase;"), shortCircuit: true };
  if (specifier === "next/server") return { url: "data:text/javascript,export const NextResponse=Response;", shortCircuit: true };
  if (specifier.startsWith("@/")) return next(pathToFileURL(path.resolve(specifier.slice(2) + ".js")).href, context);
  if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (specifier.startsWith(".") && !specifier.endsWith(".js")) return next(specifier + ".js", context);
  return next(specifier, context);
} });
const { courseStreamUpload } = await import("../lib/course-stream-upload.js");
const { streamPlayback } = await import("../lib/cloudflare-stream.js");
const { streamVideoId } = await import("../lib/stream-reference.js");
process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
process.env.CLOUDFLARE_STREAM_API_TOKEN = "test-secret";
const courseId = "11111111-1111-4111-8111-111111111111";
const lessonId = "22222222-2222-4222-8222-222222222222";
const uid = "a".repeat(32);
const assets = [];
const calls = [];
let ready = false;
let failed = false;
let denied = false;
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  if (denied) return new Response("{}", { status: 403 });
  if (url.endsWith("?direct_user=true")) return new Response(null, { status: 201, headers: { Location: "https://upload.videodelivery.net/test", "stream-media-id": uid } });
  if (url.endsWith("/token")) return Response.json({ success: true, result: { token: "signed-test-token" } });
  return Response.json({ success: true, result: { readyToStream: ready, requireSignedURLs: true, status: { state: failed ? "error" : ready ? "ready" : "inprogress" }, duration: 90, input: { width: 1920, height: 1080 }, playback: { hls: `https://customer-test.cloudflarestream.com/${uid}/manifest/video.m3u8` } } });
};
const db = { from(table) {
  const filters = [];
  let update;
  const query = {
    select() { return query; }, eq(k, v) { filters.push([k, v]); return query; }, is(k,v) { filters.push([k,v]); return query; },
    insert(row) { assets.push({ id: "asset-1", ...row }); return Promise.resolve({ error: null }); },
    update(row) { update = row; return query; },
    maybeSingle() { return Promise.resolve({ data: table === "courses" ? { id: courseId } : assets.find(a => filters.every(([k,v]) => a[k] === v)) || null }); },
    then(resolve) { for (const a of assets.filter(a => filters.every(([k,v]) => a[k] === v))) Object.assign(a, update); return Promise.resolve({ error: null }).then(resolve); },
  }; return query;
} };
const body = { action: "sign", courseId, lessonId, fileSize: 300000000, fileName: "lesson.mp4", mimeType: "video/mp4", durationSeconds: 90 };
denied = true;
await assert.rejects(courseStreamUpload(db, body), /Stream access/);
assert.equal(assets.length, 0);
denied = false;
const signed = await courseStreamUpload(db, body);
assert.equal(signed.provider, "cloudflare");
assert.equal(streamVideoId(signed.storageKey), uid);
assert.match(calls.at(-1).options.headers["Upload-Metadata"], /requiresignedurls/);
assert.equal(calls.at(-1).options.headers["Upload-Length"], "300000000");
assert.equal(assets[0].processing_status, "uploading");
const status = { ...body, action: "status", storageKey: signed.storageKey };
assert.equal((await courseStreamUpload(db, status)).processingStatus, "processing");
await assert.rejects(streamPlayback(db, signed.storageKey, courseId), /not ready/);
await assert.rejects(courseStreamUpload(db, { ...status, courseId: lessonId }), /Invalid Stream reference/);
ready = true;
assert.equal((await courseStreamUpload(db, status)).processingStatus, "ready");
assert.equal(await streamPlayback(db, signed.storageKey, courseId), "https://customer-test.cloudflarestream.com/signed-test-token/manifest/video.m3u8");
assert.equal(JSON.parse(calls.at(-1).options.body).downloadable, false);
await assert.rejects(streamPlayback(db, signed.storageKey, lessonId), /not ready/);
failed = true; ready = false;
await assert.rejects(courseStreamUpload(db, status), /different export/);
assert.equal(assets[0].processing_status, "failed");
assert.equal(streamVideoId(`${courseId}/../${uid}.stream`), "");
assert.equal(streamVideoId(`${courseId}/${lessonId}/video.mp4`), "");
// Exercise the actual student route: no signed URL may be issued before access.
const { GET } = await import("../app/api/learn/media/[kind]/[lessonId]/route.js");
let enrolled = false;
let published = true;
globalThis.testDatabase = { from(table) {
  if (table === "media_assets") return db.from(table);
  const query = { select() { return query; }, eq() { return query; }, async maybeSingle() {
    return { data: table === "course_lessons" ? { id: lessonId, course_id: courseId, status: "published", is_preview: false, storage_key: signed.storageKey, allow_download: false }
      : table === "courses" ? { status: published ? "published" : "draft" } : enrolled ? { id: "enrollment" } : null };
  } }; return query;
} };
const request = new Request(`https://example.com/api/learn/media/video/${lessonId}`);
const params = { params: Promise.resolve({ kind: "video", lessonId }) };
const previousCalls = calls.length;
globalThis.testStudent = null;
assert.equal((await GET(request, params)).status, 401);
globalThis.testStudent = { id: "student" };
assert.equal((await GET(request, params)).status, 403);
published = false; enrolled = true;
assert.equal((await GET(request, params)).status, 404);
assert.equal(calls.length, previousCalls);
published = true; ready = true; failed = false; assets[0].processing_status = "ready";
const playback = await GET(request, params);
assert.equal(playback.status, 200);
assert.equal(playback.headers.get("Cache-Control"), "private, no-store");
assert.match((await playback.json()).url, /signed-test-token/);
assert.equal((await GET(new Request(request.url + "?download=1"), params)).status, 403);
console.log("PASS: Stream authorization failure, private tus uploads >200MB, processing, failure recovery, course ownership, signed playback, and legacy references.");
