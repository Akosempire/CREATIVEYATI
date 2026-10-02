import Link from "next/link";
import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { formatCertificateDate, getCertificateBySerial } from "@/lib/data/certificates";

export const metadata = { title: "Certificate verification", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

// clean url for links and qr codes: /verify/IDY-2026-00000A
export default async function VerifySerialPage({ params }) {
  const { serial } = await params;
  const [site, socialLinks] = await Promise.all([getSiteContent(), getPublicSocialLinks()]);
  const certificate = await getCertificateBySerial(decodeURIComponent(serial || ""));
  const valid = certificate?.status === "valid";

  return <main className="public-page">
    <PublicHeader site={site} current="/verify" />
    <article className="about-note public-note">
      <p className="eyebrow">ACADEMY</p>
      <h1 className="page-title">Certificate verification.</h1>
      {certificate ? <div className="admin-list">
        <div><span>Serial<small>{certificate.serial}</small></span><span><strong>{valid ? "Valid" : "Revoked"}</strong></span></div>
        <div><span>Holder<small>{certificate.studentName || "—"}</small></span><span /></div>
        <div><span>Course<small>{certificate.courseTitle || "—"}</small></span><span /></div>
        <div><span>Issued<small>{formatCertificateDate(certificate.issuedAt)}</small></span><span /></div>
        <div><span>Instruction<small>{certificate.lessonCount} lessons · {certificate.instructionMinutes} minutes</small></span><span /></div>
        {!valid && <div><span>Revoked<small>{formatCertificateDate(certificate.revokedAt)}{certificate.revokeReason ? ` · ${certificate.revokeReason}` : ""}</small></span><span /></div>}
      </div> : <div className="empty-state"><p>No certificate matches {serial}.</p><p>Check the serial exactly as printed, including the year segment.</p><Link className="button" href="/verify">Check another serial</Link></div>}
      <div className="about-copy"><p>A certificate confirms completion of a named course and the instruction time recorded against it. It is not an accreditation or a statement of professional mastery.</p></div>
    </article>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
