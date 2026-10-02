import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { formatCertificateDate, getCertificateBySerial } from "@/lib/data/certificates";

export const metadata = { title: "Verify a certificate", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

function CertificateDetails({ certificate }) {
  const valid = certificate.status === "valid";
  return <div className="admin-list">
    <div><span>Serial<small>{certificate.serial}</small></span><span><strong>{valid ? "Valid" : "Revoked"}</strong></span></div>
    <div><span>Holder<small>{certificate.studentName || "—"}</small></span><span /></div>
    <div><span>Course<small>{certificate.courseTitle || "—"}</small></span><span /></div>
    <div><span>Issued<small>{formatCertificateDate(certificate.issuedAt)}</small></span><span /></div>
    <div><span>Instruction<small>{certificate.lessonCount} lessons · {certificate.instructionMinutes} minutes</small></span><span /></div>
    {!valid && <div><span>Revoked<small>{formatCertificateDate(certificate.revokedAt)}{certificate.revokeReason ? ` · ${certificate.revokeReason}` : ""}</small></span><span /></div>}
  </div>;
}

export default async function VerifyPage({ searchParams }) {
  const [site, socialLinks, query] = await Promise.all([getSiteContent(), getPublicSocialLinks(), searchParams]);
  const serial = String(query.serial || "").trim();
  const certificate = serial ? await getCertificateBySerial(serial) : null;

  return <main className="public-page">
    <PublicHeader site={site} current="/verify" />
    <article className="about-note public-note">
      <p className="eyebrow">ACADEMY</p>
      <h1 className="page-title">Verify a certificate.</h1>
      <div className="about-copy"><p>Enter the serial printed on the certificate. Verification confirms the course, the completion date and the instruction time recorded against that serial.</p></div>
      <form className="contact-form" method="get" action="/verify">
        <label className="form-wide">Certificate serial<input name="serial" defaultValue={serial} placeholder="IDY-2026-00000A" autoComplete="off" spellCheck={false} required /></label>
        <button className="button" type="submit">Check certificate</button>
      </form>
      {serial && (certificate ? <CertificateDetails certificate={certificate} /> : <p className="form-error">No certificate matches {serial}. Check the serial exactly as printed, including the year segment.</p>)}
      <div className="about-copy"><p>A certificate confirms completion of a named course and the instruction time recorded against it. It is not an accreditation or a statement of professional mastery.</p></div>
    </article>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
