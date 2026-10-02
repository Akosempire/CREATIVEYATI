import { formatMoney } from "@/lib/data/courses";
import { formatInvoiceDate } from "@/lib/data/invoices";

// the document a client actually receives. print styles in globals.css isolate
// .print-document, so "print" or "save as pdf" yields this alone, without the
// page chrome around it.
export default function InvoiceDocument({ invoice }) {
  const isQuote = invoice.documentType === "quote" && !invoice.acceptedAt;
  const settled = invoice.status === "paid";

  return <article className="print-document">
    <p className="print-eyebrow">{isQuote ? "Quotation" : "Invoice"} {invoice.number}</p>
    <h2 className="print-holder">{invoice.clientCompany || invoice.clientName}</h2>
    <p className="print-course">{invoice.clientName}{invoice.clientCompany ? ` · ${invoice.clientCompany}` : ""} · {invoice.clientEmail}</p>

    <table className="print-lines">
      <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
      <tbody>{invoice.items.map((item) => <tr key={item.id}>
        <td>{item.description}</td>
        <td>{item.quantity}</td>
        <td>{formatMoney(item.unitPriceMinor, invoice.currency)}</td>
        <td>{formatMoney(Math.round(item.unitPriceMinor * item.quantity), invoice.currency)}</td>
      </tr>)}</tbody>
    </table>

    <div className="print-meta">
      <div><small>Subtotal</small>{formatMoney(invoice.subtotalMinor, invoice.currency)}</div>
      {invoice.discountMinor > 0 && <div><small>Discount</small>−{formatMoney(invoice.discountMinor, invoice.currency)}</div>}
      <div><small>{settled ? "Settled" : "Total due"}</small><strong>{formatMoney(invoice.totalMinor, invoice.currency)}</strong></div>
      <div><small>Issued</small>{formatInvoiceDate(invoice.issuedAt)}</div>
      {invoice.dueAt && <div><small>Due</small>{formatInvoiceDate(invoice.dueAt)}</div>}
      <div><small>Status</small>{invoice.status}{invoice.acceptedName ? ` · accepted by ${invoice.acceptedName}` : ""}</div>
    </div>

    {invoice.receipts.length > 0 && <div className="print-meta">{invoice.receipts.map((receipt) => <div key={receipt.id}>
      <small>Receipt</small>{receipt.receiptNumber} · {formatMoney(receipt.amountMinor, receipt.currency)} · {formatInvoiceDate(receipt.issuedAt)}
    </div>)}</div>}

    {invoice.notes && <p className="print-note">{invoice.notes}</p>}
    <p className="print-note">{isQuote ? "Accepting this quotation converts it into an invoice, which can then be paid by card or bank transfer." : "Payable by card from the link sent with this document, or by bank transfer. A receipt is issued automatically once payment is recorded."}</p>
  </article>;
}
