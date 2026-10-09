import {
  createSupabaseServiceClient,
  getAdminUser,
} from "@/lib/supabase/server";
import { UUID } from "@/lib/course-workspace";
export async function GET(request) {
  if (!(await getAdminUser()))
    return Response.json(
      { error: "Administrator access required." },
      { status: 401 },
    );
  const url = new URL(request.url);
  const id = url.searchParams.get("courseId");
  const key = url.searchParams.get("key") || "";
  const kind = url.searchParams.get("kind");
  if (
    !UUID.test(id || "") ||
    !["video", "poster"].includes(kind) ||
    !key.startsWith(`${id}/`) ||
    key.includes("..")
  )
    return Response.json(
      { error: "Invalid media reference." },
      { status: 400 },
    );
  const { data, error } = await createSupabaseServiceClient()
    .storage.from(kind === "video" ? "course-videos" : "course-posters")
    .createSignedUrl(key, 120);
  return error
    ? Response.json({ error: "Media unavailable." }, { status: 404 })
    : Response.redirect(data.signedUrl);
}
