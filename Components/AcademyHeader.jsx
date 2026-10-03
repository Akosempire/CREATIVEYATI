"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// The Academy's own header. The site header belongs to the studio and sends
// visitors to Work and Services; someone on an Academy page needs the Academy.
const LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/academy/how-it-works", label: "How it works" },
  { href: "/academy/student-work", label: "Student work" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function AcademyHeader({ site, current = "/", signedIn = false }) {
  const [open, setOpen] = useState(false);
  const shell = useRef(null);

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href) => current === href || (href !== "/" && String(current).startsWith(href + "/"));
  const brand = site?.creatorName ? site.creatorName + " Academy" : "FRAME / MOTION ACADEMY";

  return <header className="academy-header" ref={shell}>
    <Link className="academy-wordmark" href="/academy">{brand}</Link>

    <nav className="academy-links" aria-label="Academy">
      {LINKS.map((link) => <Link key={link.href} href={link.href} className={isActive(link.href) ? "is-active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>)}
    </nav>

    <div className="academy-actions">
      <Link className="academy-signin" href={signedIn ? "/learn" : "/login"}>{signedIn ? "My learning" : "Sign in"}</Link>
      <Link className="academy-cta" href={signedIn ? "/learn" : "/courses"}>{signedIn ? "Continue learning" : "Get started"}</Link>
    </div>

    <button className="academy-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="academy-menu" aria-label={open ? "Close menu" : "Open menu"}>
      <span className="academy-bars" aria-hidden="true"><span /><span /><span /></span>
    </button>

    <div id="academy-menu" className={"academy-menu" + (open ? " is-open" : "")} aria-hidden={!open}>
      <nav aria-label="Academy menu">
        {LINKS.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className={isActive(link.href) ? "is-active" : undefined}>{link.label}</Link>)}
      </nav>
      <div className="academy-menu-actions">
        {signedIn
          ? <Link className="button" href="/learn" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>My learning</Link>
          : <>
              <Link className="button button-secondary" href="/login" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>Sign in</Link>
              <Link className="button" href="/courses" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>Get started</Link>
            </>}
      </div>
    </div>
  </header>;
}
