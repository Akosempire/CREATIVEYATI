"use client";

import { useState } from "react";

// mirrors the course PaymentButton, but pays a client document through its token
export default function InvoicePaymentButton({ token, amountLabel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/payments/invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment could not be started.");
      window.location.assign(result.authorizationUrl);
    } catch (paymentError) { setLoading(false); setError(paymentError.message); }
  }
  return <><button className="button" type="button" disabled={loading} onClick={pay}>{loading ? "Opening secure checkout…" : `Pay ${amountLabel}`}</button>{error && <p className="form-error" role="alert">{error}</p>}</>;
}
