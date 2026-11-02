import "server-only";
import { after } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendSignupNotification } from "@/lib/email/delivery";
export async function ensureStudentProfile(user) {
  if (!user?.email_confirmed_at) return;
  const service = createSupabaseServiceClient();
  if (!service) return;
  const fullName = String(user.user_metadata?.full_name || "").trim().slice(0, 120);
  // ignoreDuplicates returns only inserted rows, so this is non-empty once per student
  const { data: created, error } = await service.from("student_profiles").upsert({
    id: user.id, full_name: fullName,
  }, { onConflict: "id", ignoreDuplicates: true }).select("id");
  if (user.user_metadata?.newsletter_opt_in === true) {
    const {error: preferenceError}=await service.from("email_preferences").upsert({student_id:user.id,subscribed:true,consent_at:new Date().toISOString(),source:"verified-signup"},{onConflict:"student_id",ignoreDuplicates:true});
    if(preferenceError && !["42P01","PGRST205"].includes(preferenceError.code)) console.error("Preference could not be stored",{code:preferenceError.code});
  }
  if (error) console.error("Student profile could not be created", { code: error.code });
  // admin alert runs after the redirect so a slow or failed send never blocks sign-up
  if (created?.length) after(() => sendSignupNotification({ name: fullName, email: user.email, newsletter: user.user_metadata?.newsletter_opt_in === true }).catch((e) => console.error("Sign-up notification failed", { message: e.message })));
}
