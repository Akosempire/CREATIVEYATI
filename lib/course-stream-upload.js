import "server-only";
import { streamJson, streamRequest } from "./cloudflare-stream";
import { streamVideoId } from "./stream-reference";

export async function courseStreamUpload(db, body) {
  const { courseId, lessonId } = body;
  const { data: course } = await db.from("courses").select("id").eq("id", courseId).is("deleted_at", null).maybeSingle();
  if (!course) throw new Error("Save the course draft before uploading a video.");
  if (body.action === "sign") {
    const duration = Math.ceil(Number(body.durationSeconds));
    if (!Number.isFinite(duration) || duration < 1 || duration > 21600) throw new Error("Videos must be no longer than six hours.");
    const encode = value => Buffer.from(String(value)).toString("base64");
    const response = await streamRequest("?direct_user=true", {
      method: "POST", headers: {
        "Tus-Resumable": "1.0.0", "Upload-Length": String(body.fileSize),
        "Upload-Metadata": `name ${encode(body.fileName)},maxdurationseconds ${encode(duration + 60)},requiresignedurls`,
      },
    });
    const uploadURL = response.headers.get("Location");
    const uid = response.headers.get("stream-media-id");
    if (!uploadURL || !/^[a-f0-9]{32}$/i.test(uid || "")) throw new Error("Cloudflare did not return an upload reference.");
    const storageKey = `${courseId}/${lessonId}/${uid}.stream`;
    const { error } = await db.from("media_assets").insert({
      course_id: courseId, lesson_id: null, asset_type: "video", bucket: "cloudflare-stream",
      storage_key: storageKey, mime_type: body.mimeType, file_size: body.fileSize, processing_status: "uploading",
    });
    if (error) throw new Error("The upload reference could not be saved. Retry after checking the course database migration.");
    return { provider: "cloudflare", signedUrl: uploadURL, storageKey, processingStatus: "uploading" };
  }
  const key = String(body.storageKey || "");
  const uid = streamVideoId(key);
  if (!uid || !key.startsWith(`${courseId}/`)) throw new Error("Invalid Stream reference.");
  const { data: asset } = await db.from("media_assets").select("id").eq("course_id", courseId).eq("storage_key", key).eq("bucket", "cloudflare-stream").maybeSingle();
  if (!asset) throw new Error("Video does not belong to this course.");
  const video = await streamJson(`/${uid}`);
  if (!video.requireSignedURLs) throw new Error("Video privacy could not be verified.");
  const ready = video.readyToStream && video.status?.state === "ready";
  const failed = video.status?.state === "error";
  const width = Number(video.input?.width) || null;
  const height = Number(video.input?.height) || null;
  const processingStatus = failed ? "failed" : ready ? "ready" : "processing";
  const { error } = await db.from("media_assets").update({
    processing_status: processingStatus, width, height, duration_seconds: Math.ceil(video.duration || 0),
    processing_error: failed ? "Cloudflare could not process this video. Try a different export." : null,
    updated_at: new Date().toISOString(),
  }).eq("id", asset.id);
  if (error) throw new Error("Video status could not be saved. Retry the processing check.");
  if (failed) throw new Error("Cloudflare could not process this video. Try uploading a different export.");
  return { storageKey: key, width, height, durationSeconds: Math.ceil(video.duration || 0),
    orientation: width >= height ? "landscape" : "portrait", aspectRatio: width && height ? width / height : 16 / 9,
    processingStatus };
}
