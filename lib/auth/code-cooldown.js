import { cookies } from "next/headers";

// Supabase drops a second code email for the same address inside ~60s, and
// every new code cancels the last one. Remember when we sent so the pages can
// hold the resend buttons until another request would actually go out.
export const CODE_COOLDOWN_SECONDS = 60;
const COOKIE = "avc_code_sent_at";

export function normalizeEmail(value) {
 return String(value || "").trim().toLowerCase();
}

export async function markCodeSent() {
 (await cookies()).set(COOKIE, String(Date.now()), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CODE_COOLDOWN_SECONDS });
}

export async function codeCooldownRemaining() {
 const sentAt = Number((await cookies()).get(COOKIE)?.value || 0);
 if (!sentAt) return 0;
 return Math.max(0, Math.min(CODE_COOLDOWN_SECONDS, Math.ceil((sentAt + CODE_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000)));
}
