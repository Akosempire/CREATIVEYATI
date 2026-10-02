import Link from "next/link";
import CertificateDocument from "@/Components/CertificateDocument";
import PrintDocumentButton from "@/Components/PrintDocumentButton";
import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { getCertificateBySerial } from "@/lib/data/certificates";

export const metadata = { title: "Certificate verification", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

// clean url for links and qr codes: /verify/IDY-2026-000001
export default async function VerifySerialPage({ params }) {
  const { serial } = await params;
  const [site, socialLinks] = await Promise.all([getSiteContent(), getPublicSocialLinks()]);
  const certificate = await getCertificateBySerial(decodeURIComponent(serial || ""));

  return <main className="public-page">
    <PublicHeader site={site} current="/verify" />
    <article className="about-note public-note">
      <p className="eyebrow no-print">ACADEMY</p>
      <h1 className="page-title no-print">Certificate verification.</h1>
      {certificate ? <>
        <CertificateDocument certificate={certificate} />
        <div className="no-print certificate-actions">
          <PrintDocumentButton label="Print certificate" className="button" />
          <Link className="inline-link" href="/verify">Check another serial</Link>
        </div>
      </> : <div className="empty-state"><p>No certificate matches {serial}.</p><p>Check the serial exactly as printed, including the year segment.</p><Link className="button" href="/verify">Check another serial</Link></div>}
    </article>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
