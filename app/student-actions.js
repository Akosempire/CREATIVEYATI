"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAuthClient, createSupabaseServiceClient, getStudentUser } from "@/lib/supabase/server";
import { issueCertificateFor } from "@/lib/data/certificates";
import { safeNext } from "@/lib/auth/redirect";
import { canResetPassword, clearPasswordRecovery } from "@/lib/auth/recovery";
import { ensureStudentProfile } from "@/lib/auth/student-profile";

export async function resendStudentVerification(formData) {
  const supabase = await createSupabaseAuthClient();
  const next = safeNext(formData.get("next"));
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://aivideocreator.cv";
  if (!supabase) redirect("/verify-email?error=Email+verification+is+temporarily+unavailable.");
  const { error } = await supabase.auth.resend({ type: "signup", email: String(formData.get("email") || "").trim(), options: { emailRedirectTo: site + "/auth/callback?next=" + encodeURIComponent(next) } });
  if (error) {
    console.error("Auth verification email failed", { code: error.code, status: error.status });
    redirect("/verify-email?next=" + encodeURIComponent(next) + "&error=" + encodeURIComponent(error.status === 429 ? "Too many requests. Please wait before requesting another email." : "The email request could not be completed. Please try again later."));
  }
  redirect("/verify-email?next=" + encodeURIComponent(next) + "&message=If+verification+is+needed%2C+an+email+has+been+sent.");
}

export async function verifyStudentEmail(formData) {
  const supabase = await createSupabaseAuthClient();
  const next = safeNext(formData.get("next"));
  if (!supabase) redirect("/login?error=Sign-in+is+unavailable");
  const { data, error } = await supabase.auth.verifyOtp({ email: String(formData.get("email") || "").trim(), token: String(formData.get("token") || "").trim(), type: "signup" });
  if (error) redirect("/verify-email?next=" + encodeURIComponent(next) + "&error=The+code+is+invalid+or+expired.");
  await ensureStudentProfile(data.user);
  redirect(next);
}


export async function studentSignIn(formData) {
  const supabase = await createSupabaseAuthClient();
  if (!supabase) redirect("/login?error=Student+sign-in+is+not+configured");
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") || "").trim(), password: String(formData.get("password") || "") });
  if (error?.code === "email_not_confirmed") redirect("/verify-email?next=" + encodeURIComponent(next));
  if (error) redirect(`/login?error=${encodeURIComponent("Invalid email or password.")}&next=${encodeURIComponent(next)}`);
  await ensureStudentProfile(data.user);
  redirect(next);
}

export async function studentRegister(formData) {
  const supabase = await createSupabaseAuthClient();
  if (!supabase) redirect("/register?error=Student+registration+is+not+configured");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const next = safeNext(formData.get("next"));
  if (password.length < 12 || password !== String(formData.get("confirmPassword") || "") || !fullName || fullName.length > 120) redirect(`/register?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Enter your name and matching passwords of at least 12 characters.")}`);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aivideocreator.cv";
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) redirect(`/register?next=${encodeURIComponent(next)}&error=Registration+could+not+be+completed.+Please+try+again.`);
  // Profile data is written only after authentication, never from an unconfirmed signup result.
  if (data.session) { await ensureStudentProfile(data.user); redirect(next); }
  redirect(`/verify-email?next=${encodeURIComponent(next)}`);
}

export async function studentSignOut() {
  await clearPasswordRecovery();
  const supabase = await createSupabaseAuthClient(); await supabase?.auth.signOut(); redirect("/");
}

export async function requestPasswordReset(formData) {
  const supabase = await createSupabaseAuthClient();
  const email = String(formData.get("email") || "").trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aivideocreator.cv";
  const next = safeNext(formData.get("next"));
  const recoveryPath = "/reset-password/update?next=" + encodeURIComponent(next);
  if (!supabase) redirect("/reset-password?error=Password+reset+is+temporarily+unavailable.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(recoveryPath)}` });
  if (error) {
    console.error("Auth password reset email failed", { code: error.code, status: error.status });
    redirect("/reset-password?next=" + encodeURIComponent(next) + "&error=" + encodeURIComponent(error.status === 429 ? "Too many requests. Please wait before requesting another reset email." : "The reset email request could not be completed. Please try again later."));
  }
  redirect("/reset-password?next=" + encodeURIComponent(next) + "&message=If+that+account+exists%2C+a+reset+link+has+been+sent.");
}

export async function updateStudentPassword(formData) {
  const supabase = await createSupabaseAuthClient();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));
  const user = await getStudentUser();
  if (!supabase || !user || !await canResetPassword(user.id)) redirect("/reset-password?message=Open+a+fresh+reset+email+first");
  if (password.length < 12 || password !== String(formData.get("confirmPassword") || "")) redirect(`/reset-password/update?next=${encodeURIComponent(next)}&error=Use+matching+passwords+of+at+least+12+characters`);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password/update?next=${encodeURIComponent(next)}&error=Password+could+not+be+updated.+Request+a+new+reset+link.`);
  await supabase.auth.signOut({ scope: "others" });
  await clearPasswordRecovery();
  redirect(next);
}

export async function updateStudentProfile(formData) {
  const user = await getStudentUser(); const service = createSupabaseServiceClient();
  if (!user || !service) redirect("/login?next=/learn");
  const fullName = String(formData.get("fullName") || "").trim();
  if (!fullName || fullName.length > 120) redirect("/learn?error=Enter+a+valid+name");
  const { error } = await service.from("student_profiles").upsert({ id: user.id, full_name: fullName, updated_at: new Date().toISOString() });
  if (error) redirect("/learn?error=Your+profile+could+not+be+updated");
  revalidatePath("/learn", "layout"); redirect("/learn/profile?message=Profile+updated");
}

export async function markLessonComplete(formData) {
  const user = await getStudentUser(); const service = createSupabaseServiceClient();
  const courseId = String(formData.get("courseId") || ""); const lessonId = String(formData.get("lessonId") || ""); const courseSlug = String(formData.get("courseSlug") || "");
  if (!user || !service) redirect(`/login?next=${encodeURIComponent(`/learn/${courseSlug}`)}`);
  const { data: enrolment } = await service.from("enrolments").select("id").eq("student_id", user.id).eq("course_id", courseId).eq("active", true).maybeSingle();
  if (!enrolment) throw new Error("Course access is required.");
  const { data: lesson } = await service.from("course_lessons").select("id").eq("id", lessonId).eq("course_id", courseId).eq("status", "published").maybeSingle();
  if (!lesson) throw new Error("This lesson is not available.");
  const { error } = await service.from("lesson_progress").upsert({ student_id: user.id, course_id: courseId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "student_id,lesson_id" });
  if (error) throw new Error("Progress could not be saved. Please try again.");
  // issuing here ties the certificate to the action that actually finishes the course
  await issueCertificateFor({ studentId: user.id, courseId });
  revalidatePath(`/learn/${courseSlug}`);
  revalidatePath("/learn/certificates");
}
