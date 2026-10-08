"use client";

import { useState } from "react";
import PaymentButton from "./PaymentButton";
import { formatMoney } from "@/lib/money/format";

// A coupon only affects the total once the server confirms it, and the pay
// button is held back while a code is typed but not yet applied, so the amount
// shown and the amount charged can never disagree.
export default function CheckoutForm({ courseId, email, currency, amountMinor, isFree }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [applied, setApplied] = useState(null);
  const [message, setMessage] = useState("");
  const [total, setTotal] = useState(amountMinor);

  const typed = code.trim();
  const awaitingApply = Boolean(typed && (!applied || typed !== applied.code));

  async function apply() {
    if (!typed || status === "applying") return;
    setStatus("applying");
    setMessage("");
    try {
      const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, couponCode: typed }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "This coupon could not be applied.");
      setApplied({ code: result.code, discountMinor: result.discountMinor });
      setTotal(result.totalMinor);
      setStatus("applied");
      setMessage(result.discountMinor > 0 ? `${result.code} applied — you save ${formatMoney(result.discountMinor, currency)}.` : `${result.code} is valid but does not reduce this course.`);
    } catch (couponError) {
      setApplied(null);
      setTotal(amountMinor);
      setStatus("error");
      setMessage(couponError.message);
    }
  }

  function remove() {
    setApplied(null);
    setCode("");
    setTotal(amountMinor);
    setStatus("idle");
    setMessage("");
  }

  return <form className="checkout-form">
    <label className="checkout-field">Email address<input type="email" value={email} readOnly autoComplete="email" /></label>

    <div className="checkout-field">
      <label htmlFor="coupon-code">Coupon code <span className="checkout-field-note">(optional)</span></label>
      <span className="checkout-coupon">
        <input id="coupon-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" spellCheck="false" disabled={status === "applying"} placeholder="Enter code" />
        <button type="button" className="button button-secondary" onClick={apply} disabled={status === "applying" || !typed}>{status === "applying" ? "Checking…" : "Apply"}</button>
      </span>
      <small>Have a discount code? Apply it to update your total.</small>
      {message && <p className={status === "error" ? "form-error" : "checkout-coupon-note"} role="status">{message}</p>}
      {applied && <button type="button" className="checkout-coupon-remove" onClick={remove}>Remove {applied.code}</button>}
      {awaitingApply && !message && <p className="checkout-coupon-note" role="status">Apply this code before continuing.</p>}
    </div>

    <div className="checkout-payable">
      <span>Amount payable</span>
      <strong>{isFree ? "Free" : formatMoney(total, currency)}</strong>
      {applied?.discountMinor > 0 && <small>Coupon discount applied</small>}
    </div>

    <PaymentButton courseId={courseId} isFree={isFree} couponCode={applied?.code || ""} amountMinor={total} currency={currency} disabled={status === "applying" || awaitingApply} />
  </form>;
}
