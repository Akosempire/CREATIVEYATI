import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Recover links falling back to the site URL without intercepting unrelated code parameters.
function recoveryParams(request) {
  if (request.method !== "GET") return null;
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname.replace(/\/+$/, "") || "/";
  if (path === "/auth/callback" || path.startsWith("/api/")) return null;
  const params = requestUrl.searchParams;
  const recovery = params.get("token_hash") && params.get("type") === "recovery";
  const authLanding = ["/", "/login", "/admin/login", "/reset-password", "/reset-password/update"].includes(path);
  if (!recovery && !(authLanding && params.get("code"))) return null;
  return params;
}

export async function proxy(request) {
  let response = NextResponse.next({ request });
  const forwarded = recoveryParams(request);
  if (forwarded) return NextResponse.redirect(new URL("/auth/callback?" + forwarded.toString(), request.url));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !request.cookies.getAll().some(cookie => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items, headers = {}) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  // Refresh before rendering; authorization still runs in each protected action.
  await supabase.auth.getUser();
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
