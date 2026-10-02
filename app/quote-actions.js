"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { nextInvoiceNumber } from "@/lib/data/invoices";

// client-side document actions. there is no session here on purpose: the
// unguessable access token is the authorisation, and accepting is recorded with
// the name the client types so the audit trail is theirs, not ours.
export async function acceptQuotation(formData) {
  const token = String(formData.get("token") || "").trim();
  const acceptedName = String(formData.get("acceptedName") || "").trim();
  const supabase = createSupabaseServiceClient();
  if (!supabase || !token) redirect("/");
  const { data: invoice } = await supabase.from("invoices").select("*").eq("access_token", token).maybeSingle();
  if (!invoice) redirect("/");
  if (!acceptedName) redirect(`/q/${token}?status=name-required`);
  if (invoice.status === "paid") redirect(`/q/${token}?status=already-paid`);

  const acceptedAt = new Date().toISOString();
  const update = { status: "accepted", accepted_at: acceptedAt, accepted_name: acceptedName, due_at: invoice.due_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), updated_at: acceptedAt };
  // accepting a quotation turns it into an invoice with its own number
  if (invoice.document_type === "quote") { update.document_type = "invoice"; update.number = await nextInvoiceNumber(supabase, "invoice"); }

  await supabase.from("invoices").update(update).eq("id", invoice.id);
  revalidatePath(`/q/${token}`);
  revalidatePath("/admin/invoices");
  redirect(`/q/${token}?status=accepted`);
}
