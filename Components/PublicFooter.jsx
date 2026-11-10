import Link from "next/link";
import BookButton from "./home/BookButton";

// no footer clutter: the hatch, one line, book a call, a few quiet links.
export default function PublicFooter({ site }) {
  const year = new Date().getFullYear();
  return <footer className="public-footer sl-footer">
    <div className="k-hatch" aria-hidden="true" />
    <div className="sl-footer-row">
      <p>Got a product, a launch or a story to tell? <span>Let&apos;s make the video.</span></p>
      <BookButton href={site?.bookingUrl} />
    </div>
    <div className="sl-footer-base">
      <span>{site?.footerText || `© ${year} ${site?.creatorName || "Idayat Ibrahim"}`}</span>
      <nav aria-label="Footer"><Link href="/#work">Work</Link><Link href="/academy">Academy</Link><Link href="/courses">Courses</Link><Link href="/verify">Verify a certificate</Link></nav>
    </div>
  </footer>;
}
