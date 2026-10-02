import { notFound } from "next/navigation";
import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import InvoicePaymentButton from "@/Components/InvoicePaymentButton";
import { acceptQuotation } from "@/app/quote-actions";
import { formatMoney } from "@/lib/data/courses";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { formatInvoiceDate, getInvoiceByToken, invoiceBalance, isOverdue } from "@/lib/data/invoices";

export const metadata = { title: "Quotation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function QuotePage({ params, searchParams }) {
  const { token } = await params;
  const [site, socialLinks, query] = await Promise.all([getSiteContent(), getPublicSocialLinks(), searchParams]);
  const invoice = await getInvoiceByToken(token);
  if (!invoice) notFound();
  const balance = invoiceBalance(invoice);
  const isQuote = invoice.documentType === "quote" && !invoice.acceptedAt;

  return <main className="public-page">
    <PublicHeader site={site} current="/q" />
    <article className="about-note public-note">
      <p className="eyebrow">{isQuote ? "QUOTATION" : "INVOICE"}</p>
      <h1 className="page-title">{invoice.number}</h1>
      <div className="about-copy"><p>{invoice.clientCompany || invoice.clientName} · {invoice.clientEmail}</p><p>Issued {formatInvoiceDate(invoice.issuedAt)}{invoice.dueAt ? ` · due ${formatInvoiceDate(invoice.dueAt)}` : ""}{invoice.validUntil ? ` · valid until ${formatInvoiceDate(invoice.validUntil)}` : ""}{isOverdue(invoice) ? " · overdue" : ""}</p></div>

      {query.status === "accepted" && <p className="success-note">Quotation accepted. This is now invoice {invoice.number} and the payment options below are live.</p>}
      {query.status === "paid" && <p className="success-note">Thanks — we are confirming the payment with the provider. The receipt appears here the moment it is verified.</p>}
      {query.status === "cancelled" && <p className="form-error">Checkout cancelled. Nothing was charged.</p>}
      {query.status === "already-paid" && <p className="success-note">This document is already settled.</p>}
      {query.status === "name-required" && <p className="form-error">Type your name to accept this quotation.</p>}

      <div className="admin-table">
        <div><b>Description</b><b>Qty</b><b>Unit</b><b>Amount</b></div>
        {invoice.items.map((item) => <div key={item.id}>
          <span>{item.description}</span>
          <span>{item.quantity}</span>
          <span>{formatMoney(item.unitPriceMinor, invoice.currency)}</span>
          <span>{formatMoney(Math.round(item.unitPriceMinor * item.quantity), invoice.currency)}</span>
        </div>)}
      </div>

      <div className="admin-list">
        <div><span>Subtotal<small>{formatMoney(invoice.subtotalMinor, invoice.currency)}</small></span><span /></div>
        {invoice.discountMinor > 0 && <div><span>Discount<small>−{formatMoney(invoice.discountMinor, invoice.currency)}</small></span><span /></div>}
        <div><span><strong>Total{invoice.status === "paid" ? " (settled)" : " due"}</strong></span><span><strong>{formatMoney(invoice.status === "paid" ? invoice.totalMinor : balance, invoice.currency)}</strong></span></div>
      </div>

      {isQuote && <form className="contact-form" action={acceptQuotation}>
        <input type="hidden" name="token" value={token} />
        <label className="form-wide">Type your full name to accept<input name="acceptedName" autoComplete="name" required /><small>The date, name and time are recorded against this document.</small></label>
        <button className="button" type="submit">Accept quotation</button>
      </form>}

      {!isQuote && balance > 0 && <div className="contact-form">
        <div className="form-wide"><InvoicePaymentButton token={token} amountLabel={formatMoney(balance, invoice.currency)} /><small>Card and local payment methods are handled by Bachs on a secure hosted page. A bank transfer works too — this page updates once it is recorded.</small></div>
      </div>}

      {invoice.receipts.length > 0 && <section className="purchase-history"><h2>Receipts</h2><div className="admin-list">{invoice.receipts.map((receipt) => <div key={receipt.id}><span>{receipt.receiptNumber}<small>Issued {formatInvoiceDate(receipt.issuedAt)}{receipt.channel ? ` · ${receipt.channel}` : ""}</small></span><strong>{formatMoney(receipt.amountMinor, receipt.currency)}</strong></div>)}</div></section>}

      {invoice.notes && <div className="about-copy"><p>{invoice.notes}</p></div>}
    </article>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
