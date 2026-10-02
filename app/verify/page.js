import Link from "next/link";
import CertificateDocument from "@/Components/CertificateDocument";
import PrintDocumentButton from "@/Components/PrintDocumentButton";
import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { getCertificateBySerial } from "@/lib/data/certificates";

export const metadata = { title: "Verify a certificate", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }) {
  const [site, socialLinks, query] = await Promise.all([getSiteContent(), getPublicSocialLinks(), searchParams]);
  const serial = String(query.serial || "").trim();
  const certificate = serial ? await getCertificateBySerial(serial) : null;

  return <main className="public-page">
    <PublicHeader site={site} current="/verify" />
    <article className="about-note public-note">
      <p className="eyebrow no-print">ACADEMY</p>
      <h1 className="page-title no-print">Verify a certificate.</h1>
      <div className="about-copy no-print"><p>Enter the serial printed on the certificate. Verification confirms the course, the completion date and the instruction time recorded against that serial.</p></div>
      <form className="contact-form no-print" method="get" action="/verify">
        <label className="form-wide">Certificate serial<input name="serial" defaultValue={serial} placeholder="IDY-2026-000001" autoComplete="off" spellCheck={false} required /></label>
        <button className="button" type="submit">Check certificate</button>
      </form>
      {serial && (certificate ? <>
        <CertificateDocument certificate={certificate} />
        <div className="no-print certificate-actions">
          <PrintDocumentButton label="Print certificate" className="button" />
          <Link className="inline-link" href={certificate.verifyPath}>Permanent link to this certificate</Link>
        </div>
      </> : <p className="form-error">No certificate matches {serial}. Check the serial exactly as printed, including the year segment.</p>)}
      <div className="about-copy no-print"><p>A certificate confirms completion of a named course and the instruction time recorded against it. It is not an accreditation or a statement of professional mastery.</p></div>
    </article>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
