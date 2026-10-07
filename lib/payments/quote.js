import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export class QuoteError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// Prices are derived from the database only. The browser sends a course id and
// a coupon code and never an amount, so a quoted total can be trusted by both
// the checkout UI and order initialisation.
export async function quoteCourse(courseId) {
  const service = createSupabaseServiceClient();
  if (!service) throw new QuoteError("Course payments are not configured.", 503);
  const { data: course } = await service.from("courses").select("*").eq("id", courseId).in("status", ["published", "scheduled"]).is("deleted_at", null).maybeSingle();
  if (!course || (course.status === "scheduled" && (!course.scheduled_for || new Date(course.scheduled_for).getTime() > Date.now()))) throw new QuoteError("This course is not available.", 404);
  const currentTime = Date.now();
  const saleActive = course.discounted_price_minor != null
    && (!course.sale_starts_at || new Date(course.sale_starts_at).getTime() <= currentTime)
    && (!course.sale_ends_at || new Date(course.sale_ends_at).getTime() >= currentTime);
  const original = course.is_free ? 0 : Number(course.price_minor);
  const salePrice = course.is_free ? 0 : Number(saleActive ? course.discounted_price_minor : course.price_minor);
  return { service, course, original, salePrice, discount: 0, amount: salePrice, code: "", coupon: null };
}

// Kept separate from the course lookup so callers can check ownership before
// reporting a bad coupon, which is what a returning customer needs to see.
export async function applyCoupon(quote, couponCode) {
  const code = String(couponCode || "").trim().toUpperCase();
  if (!code) return { ...quote, code: "", coupon: null, discount: 0, amount: quote.salePrice };
  const { data } = await quote.service.from("coupons").select("*").eq("code", code).eq("enabled", true).maybeSingle();
  const now = Date.now();
  if (!data || (data.starts_at && new Date(data.starts_at).getTime() > now) || (data.expires_at && new Date(data.expires_at).getTime() < now) || (data.max_redemptions && data.redemption_count >= data.max_redemptions)) throw new QuoteError("This coupon is invalid or expired.", 400);
  if (data.discount_type === "fixed" && data.currency.toUpperCase() !== quote.course.currency.toUpperCase()) throw new QuoteError("This coupon is not valid for the course currency.", 400);
  const discount = Math.min(quote.salePrice, data.discount_type === "percent"
    ? Math.round(quote.salePrice * Math.min(Number(data.discount_value), 100) / 100)
    : Math.round(Number(data.discount_value) * 100));
  return { ...quote, code, coupon: data, discount, amount: Math.max(0, quote.salePrice - discount) };
}
