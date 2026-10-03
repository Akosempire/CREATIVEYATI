// Status badge. Always carries a visible label: the brief is explicit that colour
// alone is never the signal, so tone is decoration and the text is the meaning.
const TONES = { neutral: "", success: "is-success", warning: "is-warning", error: "is-error", accent: "is-accent" };

export default function Badge({ tone = "neutral", children }) {
  return <span className={`fm-badge ${TONES[tone] ?? ""}`.trim()}>{children}</span>;
}

// Maps the values this app actually stores to a tone, so a page never has to
// invent its own status colours.
export function toneForStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["paid", "successful", "published", "valid", "accepted", "active", "completed"].includes(value)) return "success";
  if (["pending", "draft", "processing", "partially_paid", "scheduled"].includes(value)) return "warning";
  if (["failed", "revoked", "declined", "overdue", "void", "refunded", "abandoned"].includes(value)) return "error";
  return "neutral";
}
