import Link from "next/link";
import SocialLinks from "./SocialLinks";

// closing line + index, in the homepage voice. same props as before.
export default function PublicFooter({ site, socialLinks = [] }) {
  const year = new Date().getFullYear();
  return <footer className="public-footer sl-footer">
    <div className="sl-footer-top">
      <p className="sl-footer-big">Big idea? <span>You know where to find me.</span></p>
      <Link className="sl-cta" href="/contact">Start a project <span aria-hidden="true">↗</span></Link>
    </div>
    <div className="sl-footer-cols">
      <nav aria-label="Footer navigation">
        <h2 className="sl-label">Explore</h2>
        <Link href="/">Work</Link><Link href="/services">Services</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link>
      </nav>
      <nav aria-label="Academy">
        <h2 className="sl-label">Academy</h2>
        <Link href="/academy">The Academy</Link><Link href="/courses">Courses</Link><Link href="/login">Sign in</Link><Link href="/verify">Verify a certificate</Link>
      </nav>
      <div>
        <h2 className="sl-label">Reach</h2>
        {site?.publicEmail && <a href={`mailto:${site.publicEmail}`}>{site.publicEmail}</a>}
        {site?.phone && <a href={`tel:${String(site.phone).replace(/\s+/g, "")}`}>{site.phone}</a>}
        <SocialLinks links={socialLinks} compact label="Creator profiles" />
        <Link href="/contact">Send an enquiry</Link>
      </div>
    </div>
    <div className="sl-footer-base">
      <span>{site?.footerText || `© ${year} ${site?.creatorName || "AI Video Creator"}`}</span>
      <span>{site?.availability || "Nigeria · Available worldwide"}</span>
    </div>
  </footer>;
}
