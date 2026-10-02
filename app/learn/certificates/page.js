import Link from "next/link";
import CertificateDocument from "@/Components/CertificateDocument";
import PrintDocumentButton from "@/Components/PrintDocumentButton";
import { getStudentCertificates } from "@/lib/data/certificates";

export const metadata = { title: "My certificates" };

export default async function StudentCertificatesPage() {
  const certificates = await getStudentCertificates();
  return <section className="learn-dashboard public-note">
    <p className="eyebrow no-print">MY LEARNING</p><h1 className="page-title no-print">Certificates.</h1>
    <p className="admin-lede no-print">Issued automatically when every published lesson in a course is complete. Each one carries a serial and a public verification link you can share with anyone.</p>
    <p className="no-print"><Link className="inline-link" href="/learn">Back to my learning</Link></p>
    {certificates.length ? <div className="certificate-list">{certificates.map((certificate) => <div key={certificate.id}>
      <CertificateDocument certificate={certificate} />
      <div className="no-print certificate-actions">
        <a className="button" href={`/api/learn/certificate/${certificate.id}`}>Download PDF</a>
        <PrintDocumentButton label="Print certificate" className="button button-secondary" />
        <Link className="inline-link" href={certificate.verifyPath}>Open verification page</Link>
      </div>
    </div>)}</div> : <div className="empty-state"><p>No certificate yet. Finish every lesson in a course and it is issued here automatically.</p><Link className="button" href="/learn">Back to my learning</Link></div>}
  </section>;
}
