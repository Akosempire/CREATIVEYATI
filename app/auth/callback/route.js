import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";
import { grantPasswordRecovery } from "@/lib/auth/recovery";
import { ensureStudentProfile } from "@/lib/auth/student-profile";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next") || "/learn";
  const next = safeNext(requested);
  if (code) {
    const supabase = await createSupabaseAuthClient();
    if (!supabase) return NextResponse.redirect(new URL("/login?error=Sign-in+is+unavailable", url.origin));
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (!next.startsWith("/admin")) await ensureStudentProfile(data.user);
      if (new URL(next, url.origin).pathname === "/reset-password/update" && data.user) await grantPasswordRecovery(data.user.id);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=The+sign-in+link+is+invalid+or+expired", url.origin));
}
