import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCertificateDate } from "@/lib/data/certificates";

// A real file rather than a print dialog, so a student can keep or send their
// certificate. Pure JS, so it runs on serverless without a headless browser.
// Standard fonts only, which keeps the file small and needs no font uploads.

const INK = rgb(0.09, 0.09, 0.08);
const MUTED = rgb(0.44, 0.44, 0.42);
const RULE = rgb(0.84, 0.84, 0.82);
const REVOKED = rgb(0.6, 0.15, 0.15);

export async function buildCertificatePdf(certificate) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const centred = (text, font, size, y, color = INK) =>
    page.drawText(text, { x: (width - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aivideocreator.cv").replace(/\/$/, "");
  const verifyUrl = `${siteUrl}${certificate.verifyPath}`;
  const revoked = certificate.status !== "valid";

  pdf.setTitle(`Certificate ${certificate.serial}`);
  pdf.setSubject(certificate.courseTitle || "Course completion");
  pdf.setProducer("IDAYAT Academy");

  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderWidth: 1, borderColor: INK });
  page.drawRectangle({ x: 41, y: 41, width: width - 82, height: height - 82, borderWidth: 0.5, borderColor: RULE });

  centred("CERTIFICATE OF COMPLETION", sans, 10, height - 108, MUTED);
  centred(certificate.studentName || "Student", serifBold, 36, height - 172);
  centred(`has completed ${certificate.courseTitle || "the course"}`, serif, 15, height - 208, MUTED);

  page.drawLine({ start: { x: width / 2 - 150, y: height - 238 }, end: { x: width / 2 + 150, y: height - 238 }, thickness: 0.5, color: RULE });

  const facts = [
    `Issued ${formatCertificateDate(certificate.issuedAt)}`,
    `${certificate.lessonCount} lessons`,
    `${certificate.instructionMinutes} minutes of instruction`,
    `Result ${certificate.grade}`,
  ].join("   -   ");
  centred(facts, sans, 10.5, height - 268, INK);

  if (revoked) {
    centred("REVOKED", sansBold, 12, height - 310, REVOKED);
    if (certificate.revokeReason) centred(certificate.revokeReason, sans, 9.5, height - 328, REVOKED);
  }

  page.drawText(`Serial ${certificate.serial}`, { x: 70, y: 96, size: 9.5, font: sansBold, color: INK });
  page.drawText(verifyUrl, { x: 70, y: 82, size: 8.5, font: sans, color: MUTED });
  page.drawText("This confirms completion of the course above and the instruction time recorded against it.", { x: 70, y: 62, size: 8, font: sans, color: MUTED });
  page.drawText("It is not an accreditation or a statement of professional mastery.", { x: 70, y: 51, size: 8, font: sans, color: MUTED });

  return pdf.save();
}
