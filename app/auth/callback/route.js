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
  const tokenHash = url.searchParams.get("token_hash");
  const recoveryToken = Boolean(tokenHash && url.searchParams.get("type") === "recovery");
  const recoveryDestination = new URL(next, url.origin).pathname === "/reset-password/update";
  if (code || recoveryToken) {
    const supabase = await createSupabaseAuthClient();
    if (!supabase) return NextResponse.redirect(new URL("/login?error=Sign-in+is+unavailable", url.origin));
    const { data, error } = recoveryToken
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
      : await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user && (recoveryToken || data.redirectType === "recovery")) {
        await grantPasswordRecovery(data.user.id);
        const destination = recoveryDestination ? next : "/reset-password/update?next=" + encodeURIComponent(next);
        return NextResponse.redirect(new URL(destination, url.origin));
      }
      if (recoveryDestination) return NextResponse.redirect(new URL("/reset-password?error=Open+a+valid+password+reset+email+to+continue.", url.origin));
      if (!next.startsWith("/admin")) await ensureStudentProfile(data.user);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  const failure = recoveryToken || recoveryDestination
    ? "/reset-password?error=This+reset+link+is+invalid+or+expired.+Please+request+a+new+one."
    : "/login?error=The+sign-in+link+is+invalid+or+expired";
  return NextResponse.redirect(new URL(failure, url.origin));
}
