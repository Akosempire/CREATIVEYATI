import Link from "next/link";
import InvoiceLineItems from "@/Components/InvoiceLineItems";
import { markInvoicePaid, saveInvoice, updateInvoiceStatus } from "@/app/admin/actions";
import { formatMoney } from "@/lib/data/courses";
import { financeSummary, formatInvoiceDate, getAdminInvoices, isOverdue } from "@/lib/data/invoices";

export const metadata = { title: "Quotations and invoices" };

const STATUSES = ["draft", "sent", "accepted", "declined", "paid", "void"];

export default async function AdminInvoicesPage({ searchParams }) {
  const [invoices, query] = await Promise.all([getAdminInvoices(), searchParams]);
  const summary = financeSummary(invoices);
  const currency = invoices[0]?.currency || "NGN";

  return <>
    <div className="admin-title">
      <p>COMMERCE</p>
      <h1>Quotations and invoices</h1>
      <p className="admin-lede">Price a scope of work, send the client their private link, then record settlement. Card payments run through the same Bachs checkout as courses; transfers are recorded here. Both issue a receipt automatically.</p>
    </div>
    {query.saved && <p className="success-note">Document saved.</p>}
    {query.paid && <p className="success-note">Payment recorded and the receipt was issued.</p>}
    {query.error && <p className="form-error">{query.error}</p>}

    <section className="admin-section-heading"><p>POSITION</p><h2>{formatMoney(summary.collectedMinor, currency)} collected · {formatMoney(summary.outstandingMinor, currency)} outstanding · {summary.overdueCount} overdue</h2></section>

    <details className="student-profile"><summary>New quotation or invoice</summary>
      <form className="admin-form" action={saveInvoice}>
        <label>Type<select name="documentType" defaultValue="quote"><option value="quote">Quotation</option><option value="invoice">Invoice</option></select></label>
        <label>Client name<input name="clientName" required /></label>
        <label>Company<input name="clientCompany" /></label>
        <label>Client email<input name="clientEmail" type="email" required /></label>
        <label>Currency<select name="currency" defaultValue="NGN"><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></label>
        <label>Discount<input name="discount" defaultValue="0" /></label>
        <label>Due date<input name="dueAt" type="date" /></label>
        <label>Valid until<input name="validUntil" type="date" /></label>
        <InvoiceLineItems />
        <label className="form-wide">Notes and terms<textarea name="notes" /></label>
        <button className="button" type="submit">Create document</button>
      </form>
    </details>

    <section className="admin-section-heading"><p>DOCUMENTS</p><h2>{invoices.length} on file</h2></section>
    {invoices.length ? <div className="admin-table">
      <div><b>Number</b><b>Client</b><b>Total</b><b>Dates</b><b>Status</b><b>Actions</b></div>
      {invoices.map((invoice) => <div key={invoice.id}>
        <span>{invoice.number}<small>{invoice.documentType === "quote" ? "Quotation" : "Invoice"}</small></span>
        <span>{invoice.clientCompany || invoice.clientName}<small>{invoice.clientEmail}</small></span>
        <span>{formatMoney(invoice.totalMinor, invoice.currency)}{invoice.receipts.length ? <small>Receipt {invoice.receipts[0].receiptNumber}</small> : null}</span>
        <span>{formatInvoiceDate(invoice.issuedAt)}{invoice.dueAt ? <small>Due {formatInvoiceDate(invoice.dueAt)}</small> : null}</span>
        <span>{invoice.status}{isOverdue(invoice) ? " · overdue" : ""}{invoice.acceptedName ? <small>Accepted by {invoice.acceptedName}</small> : null}</span>
        <span>
          <Link className="inline-link" href={`/q/${invoice.accessToken}`} target="_blank" rel="noreferrer">Client link</Link>
          <details><summary className="inline-link">Status</summary>
            <form className="admin-form" action={updateInvoiceStatus}>
              <input type="hidden" name="id" value={invoice.id} />
              <label>Status<select name="status" defaultValue={invoice.status}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <label>Accepted by<input name="acceptedName" defaultValue={invoice.acceptedName} /></label>
              <button className="button button-secondary" type="submit">Save status</button>
            </form>
          </details>
          {invoice.status !== "paid" && <details><summary className="inline-link">Record payment</summary>
            <form className="admin-form" action={markInvoicePaid}>
              <input type="hidden" name="id" value={invoice.id} />
              <label>Channel<select name="channel" defaultValue="Bank transfer"><option value="Bank transfer">Bank transfer</option><option value="Cash">Cash</option><option value="Card terminal">Card terminal</option><option value="Other">Other</option></select></label>
              <label>Reference<input name="reference" placeholder="Transfer narration or teller reference" /></label>
              <button className="button button-secondary" type="submit">Record {formatMoney(invoice.totalMinor, invoice.currency)} received</button>
            </form>
          </details>}
        </span>
      </div>)}
    </div> : <p className="empty-state admin-empty-state">No documents yet. Create a quotation to send a client a priced scope of work.</p>}
  </>;
}
