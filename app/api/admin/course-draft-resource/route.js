import { randomUUID } from "node:crypto";
import {
  createSupabaseServiceClient,
  getAdminUser,
} from "@/lib/supabase/server";
import { UUID } from "@/lib/course-workspace";
export async function POST(request) {
  if (!(await getAdminUser()))
    return Response.json(
      { error: "Administrator access required." },
      { status: 401 },
    );
  const db = createSupabaseServiceClient();
  const form = await request.formData();
  const courseId = String(form.get("courseId") || "");
  const file = form.get("file");
  if (
    !UUID.test(courseId) ||
    !(file instanceof File) ||
    file.type !== "application/pdf" ||
    !file.size ||
    file.size > 25 * 1024 * 1024
  )
    return Response.json(
      { error: "Choose a PDF no larger than 25 MB." },
      { status: 400 },
    );
  const { data: course } = await db
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!course)
    return Response.json(
      { error: "Save the draft before uploading resources." },
      { status: 400 },
    );
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-")
    return Response.json(
      { error: "The file is not a valid PDF." },
      { status: 400 },
    );
  const key = `${courseId}/draft/${randomUUID()}.pdf`;
  const { error } = await db.storage
    .from("course-resources")
    .upload(key, bytes, { contentType: "application/pdf", upsert: false });
  if (error)
    return Response.json(
      { error: "Upload failed. Please retry." },
      { status: 502 },
    );
  return Response.json({
    id: randomUUID(),
    title: file.name.replace(/\.pdf$/i, ""),
    description: "",
    storageKey: key,
    fileSize: file.size,
    allowDownload: true,
    previewAllowed: false,
  });
}
export async function GET(request) {
  if (!(await getAdminUser()))
    return Response.json(
      { error: "Administrator access required." },
      { status: 401 },
    );
  const url = new URL(request.url);
  const id = url.searchParams.get("courseId");
  const key = url.searchParams.get("key") || "";
  if (!UUID.test(id || "") || !key.startsWith(`${id}/`) || key.includes(".."))
    return Response.json({ error: "Invalid resource." }, { status: 400 });
  const { data, error } = await createSupabaseServiceClient()
    .storage.from("course-resources")
    .createSignedUrl(key, 120);
  return error
    ? Response.json({ error: "Resource unavailable." }, { status: 404 })
    : Response.redirect(data.signedUrl);
}
