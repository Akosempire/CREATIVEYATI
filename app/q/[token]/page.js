import { notFound } from "next/navigation";
import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import InvoiceDocument from "@/Components/InvoiceDocument";
import InvoicePaymentButton from "@/Components/InvoicePaymentButton";
import PrintDocumentButton from "@/Components/PrintDocumentButton";
import { acceptQuotation } from "@/app/quote-actions";
import { formatMoney } from "@/lib/data/courses";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { getInvoiceByToken, invoiceBalance, isOverdue } from "@/lib/data/invoices";

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
      <p className="eyebrow no-print">{isQuote ? "QUOTATION" : "INVOICE"}</p>
      <h1 className="page-title no-print">{invoice.number}</h1>

      {query.status === "accepted" && <p className="success-note no-print">Quotation accepted. This is now invoice {invoice.number} and the payment options below are live.</p>}
      {query.status === "paid" && <p className="success-note no-print">Thanks — we are confirming the payment with the provider. The receipt appears here the moment it is verified.</p>}
      {query.status === "cancelled" && <p className="form-error no-print">Checkout cancelled. Nothing was charged.</p>}
      {query.status === "already-paid" && <p className="success-note no-print">This document is already settled.</p>}
      {query.status === "name-required" && <p className="form-error no-print">Type your name to accept this quotation.</p>}
      {isOverdue(invoice) && <p className="form-error no-print">This document is past its due date.</p>}

      <InvoiceDocument invoice={invoice} />

      <div className="no-print certificate-actions">
        <PrintDocumentButton label="Print or save as PDF" className="button button-secondary" />
      </div>

      {isQuote && <form className="contact-form no-print" action={acceptQuotation}>
        <input type="hidden" name="token" value={token} />
        <label className="form-wide">Type your full name to accept<input name="acceptedName" autoComplete="name" required /><small>The date, name and time are recorded against this document.</small></label>
        <button className="button" type="submit">Accept quotation</button>
      </form>}

      {!isQuote && balance > 0 && <div className="contact-form no-print">
        <div className="form-wide"><InvoicePaymentButton token={token} amountLabel={formatMoney(balance, invoice.currency)} /><small>Card and local payment methods are handled by Bachs on a secure hosted page. A bank transfer works too — this page updates once it is recorded.</small></div>
      </div>}
    </article>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
