import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatInvoiceDate } from "@/lib/data/invoices";

// Same reason as the certificate: a real file the client can keep, generated in
// pure JS so it runs on serverless with no headless browser.
//
// Two deliberate constraints, both because StandardFonts are WinAnsi only:
// money is written as "NGN 1,800,000.00" rather than a currency symbol, since
// the naira sign is not encodable, and text is stripped to printable ASCII,
// because an unencodable character would throw and fail the whole download.
// Proper support needs an embedded Unicode font.

const INK = rgb(0.09, 0.09, 0.08);
const MUTED = rgb(0.44, 0.44, 0.42);
const RULE = rgb(0.84, 0.84, 0.82);
const PAGE = [595, 842]; // A4 portrait

function safe(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function money(amountMinor, currency) {
  const amount = (Number(amountMinor) || 0) / 100;
  return `${safe(currency || "NGN")} ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function buildInvoicePdf(invoice) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(PAGE);
  const { width, height } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const margin = 56;
  const right = width - margin;
  const isQuote = invoice.documentType === "quote" && !invoice.acceptedAt;

  pdf.setTitle(`${invoice.number}`);
  pdf.setSubject(safe(invoice.courseTitle || ""));
  pdf.setProducer("IDAYAT Academy");

  const text = (value, x, y, size = 10, font = body, color = INK) => page.drawText(safe(value), { x, y, size, font, color });
  const rightText = (value, y, size = 10, font = body, color = INK) => {
    const clean = safe(value);
    page.drawText(clean, { x: right - font.widthOfTextAtSize(clean, size), y, size, font, color });
  };

  text(isQuote ? "QUOTATION" : "INVOICE", margin, height - 72, 9, bold, MUTED);
  text(invoice.number, margin, height - 98, 20, serif);
  text(invoice.clientName, margin, height - 130, 11, bold);
  if (invoice.clientCompany) text(invoice.clientCompany, margin, height - 146, 10, body, MUTED);
  text(invoice.clientEmail, margin, height - 162, 10, body, MUTED);

  text(`Issued ${formatInvoiceDate(invoice.issuedAt)}`, margin, height - 190, 9.5, body, MUTED);
  if (invoice.dueAt) rightText(`Due ${formatInvoiceDate(invoice.dueAt)}`, height - 190, 9.5, body, MUTED);
  if (invoice.validUntil) text(`Valid until ${formatInvoiceDate(invoice.validUntil)}`, margin, height - 205, 9.5, body, MUTED);

  let y = height - 244;
  page.drawLine({ start: { x: margin, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.5, color: RULE });
  text("DESCRIPTION", margin, y, 8, bold, MUTED);
  rightText("AMOUNT", y, 8, bold, MUTED);
  y -= 22;

  for (const item of invoice.items) {
    if (y < 210) { text("... continued", margin, y, 9, body, MUTED); break; }
    text(item.description, margin, y, 10);
    rightText(money(Math.round(item.unitPriceMinor * item.quantity), invoice.currency), y);
    const detail = `${item.quantity} x ${money(item.unitPriceMinor, invoice.currency)}`;
    text(detail, margin, y - 12, 8.5, body, MUTED);
    y -= 34;
    page.drawLine({ start: { x: margin, y: y + 12 }, end: { x: right, y: y + 12 }, thickness: 0.4, color: RULE });
  }

  y -= 8;
  rightText(`Subtotal ${money(invoice.subtotalMinor, invoice.currency)}`, y, 10);
  if (invoice.discountMinor > 0) { y -= 16; rightText(`Discount -${money(invoice.discountMinor, invoice.currency)}`, y, 10); }
  y -= 24;
  rightText(`${invoice.status === "paid" ? "Settled" : "Total due"} ${money(invoice.totalMinor, invoice.currency)}`, y, 13, bold);

  y -= 30;
  text(`Status ${invoice.status}`, margin, y, 9.5, body, MUTED);
  if (invoice.acceptedName) text(`Accepted by ${invoice.acceptedName}`, margin, y - 14, 9.5, body, MUTED);
  if (invoice.paymentChannel) text(`Paid by ${invoice.paymentChannel}${invoice.paymentReference ? ` - ${invoice.paymentReference}` : ""}`, margin, y - 28, 9.5, body, MUTED);

  for (const receipt of invoice.receipts || []) {
    y -= 20;
    text(`Receipt ${receipt.receiptNumber} - ${money(receipt.amountMinor, receipt.currency)} - ${formatInvoiceDate(receipt.issuedAt)}`, margin, y, 9.5, body, MUTED);
  }

  if (invoice.notes) {
    y -= 26;
    text(invoice.notes, margin, y, 9, body, MUTED);
  }

  text(isQuote ? "Accepting this quotation converts it into an invoice." : "Payable by card from the link sent with this document, or by bank transfer. A receipt is issued once payment is recorded.", margin, 72, 8.5, body, MUTED);
  text(invoice.number, margin, 56, 8.5, bold, MUTED);

  return pdf.save();
}
