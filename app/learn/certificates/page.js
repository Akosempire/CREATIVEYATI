import Link from "next/link";
import { formatCertificateDate, getStudentCertificates } from "@/lib/data/certificates";

export const metadata = { title: "My certificates" };

export default async function StudentCertificatesPage() {
  const certificates = await getStudentCertificates();
  return <section className="learn-dashboard public-note">
    <p className="eyebrow">MY LEARNING</p><h1 className="page-title">Certificates.</h1>
    <p className="admin-lede">Issued automatically when every published lesson in a course is complete. Each certificate carries a serial and a public verification link you can share with anyone.</p>
    <p><Link className="inline-link" href="/learn">Back to my learning</Link></p>
    {certificates.length ? <div className="admin-list">{certificates.map((certificate) => <div key={certificate.id}>
      <span>{certificate.courseTitle}<small>{certificate.lessonCount} lessons · {certificate.instructionMinutes} minutes · issued {formatCertificateDate(certificate.issuedAt)}{certificate.status === "revoked" ? ` · revoked${certificate.revokeReason ? ` (${certificate.revokeReason})` : ""}` : ""}</small></span>
      <span><strong>{certificate.serial}</strong><Link className="inline-link" href={certificate.verifyPath}>Verify</Link></span>
    </div>)}</div> : <div className="empty-state"><p>No certificate yet. Finish every lesson in a course and it is issued here automatically.</p><Link className="button" href="/learn">Back to my learning</Link></div>}
    <p className="admin-lede">A certificate confirms completion of the course and the instruction time recorded against it. It is not an accreditation or a statement of professional mastery.</p>
  </section>;
}
