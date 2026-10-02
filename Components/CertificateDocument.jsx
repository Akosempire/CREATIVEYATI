import qrcode from "qrcode-generator";
import { formatCertificateDate } from "@/lib/data/certificates";

// a qr of the public verification url, so a printed certificate can still be
// checked without typing the serial
function qrSvg(value) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0 });
}

export default function CertificateDocument({ certificate, note = true }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aivideocreator.cv";
  const verifyUrl = `${siteUrl}${certificate.verifyPath}`;
  const valid = certificate.status === "valid";

  return <article className="print-document">
    <p className="print-eyebrow">Certificate of completion</p>
    <h2 className="print-holder">{certificate.studentName || "—"}</h2>
    <p className="print-course">has completed {certificate.courseTitle || "the course"}</p>
    <div className="print-meta">
      <div><small>Issued</small>{formatCertificateDate(certificate.issuedAt)}</div>
      <div><small>Instruction</small>{certificate.lessonCount} lessons · {certificate.instructionMinutes} minutes</div>
      <div><small>Result</small>{certificate.grade}</div>
      <div><small>Status</small>{valid ? "Valid" : `Revoked${certificate.revokeReason ? ` · ${certificate.revokeReason}` : ""}`}</div>
    </div>
    <div className="print-foot">
      {/* our own generated svg, never third-party markup */}
      <div className="print-qr" dangerouslySetInnerHTML={{ __html: qrSvg(verifyUrl) }} />
      <div>
        <p className="print-serial">Serial {certificate.serial}</p>
        <p className="print-serial">{verifyUrl}</p>
      </div>
    </div>
    {note && <p className="print-note">This confirms completion of the course above and the instruction time recorded against it. It is not an accreditation or a statement of professional mastery. The serial can be checked at any time using the link or the code shown.</p>}
  </article>;
}
