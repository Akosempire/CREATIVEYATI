import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
export async function ensureStudentProfile(user) {
  if (!user?.email_confirmed_at) return;
  const service = createSupabaseServiceClient();
  if (!service) return;
  const { error } = await service.from("student_profiles").upsert({
    id: user.id, full_name: String(user.user_metadata?.full_name || "").trim().slice(0, 120),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) console.error("Student profile could not be created", { code: error.code });
}
