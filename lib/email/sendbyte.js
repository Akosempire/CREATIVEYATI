import "server-only";

const API_BASE = "https://api.sendbyte.africa/v1";

export async function sendbyteMessage({ from, to, subject, text, html, replyTo }) {
  const apiKey = String(process.env.SENDBYTE_API_KEY || "").trim();
  if (!apiKey) throw new Error("SendByte is not configured: set SENDBYTE_API_KEY.");
  const response = await fetch(`${API_BASE}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html, reply_to: replyTo }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`SendByte rejected the message (HTTP ${response.status}): ${detail}`);
  }
  return response.json();
}
