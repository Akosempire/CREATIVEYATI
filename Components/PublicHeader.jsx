"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminIcon, ChevronDownIcon, SocialIcon } from "./Icons";
import ProfileAvatar from "./ProfileAvatar";

// Two businesses on one brand: the studio sells the work, the academy sells the
// course. Each context gets its own link set and calls to action rather than one
// compromised menu. The desktop bar reads these; the mobile drawer flattens them.
const studioLinks = [
  { href: "/work", label: "Work", icon: "video" },
  { href: "/services", label: "Services", icon: "settings" },
  {
    href: "/academy",
    label: "Academy",
    icon: "award",
    children: [
      { href: "/academy", label: "Course overview", description: "What you learn and who it is for" },
      { href: "/academy#curriculum", label: "Curriculum", description: "Modules, lessons and free previews" },
      { href: "/academy#pricing", label: "Pricing", description: "One payment, lifetime access" },
      { href: "/verify", label: "Verify a certificate", description: "Check a serial from any certificate" },
    ],
  },
  { href: "/about", label: "About", icon: "user" },
  { href: "/contact", label: "Contact", icon: "mail" },
];

const academyLinks = [
  { href: "/academy", label: "Course", icon: "book" },
  { href: "/academy#curriculum", label: "Curriculum", icon: "folder" },
  { href: "/academy#pricing", label: "Pricing", icon: "folder" },
  { href: "/work", label: "See the work", icon: "video" },
  { href: "/verify", label: "Verify a certificate", icon: "award" },
  { href: "/about", label: "About", icon: "user" },
];

// the academy context covers the course pages and everything behind the door
function isAcademyPath(path) {
  return path === "/academy" || String(path).startsWith("/academy") || String(path).startsWith("/learn") || String(path).startsWith("/dashboard");
}

export default function PublicHeader({ site, current = "/" }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const root = useRef(null);
  const timer = useRef(null);
  const initials = String(site.creatorName || "Portfolio")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const profilePosition = `${Number(site.profileFocalX) || 50}% ${Number(site.profileFocalY) || 50}%`;

  const academy = isAcademyPath(current);
  const links = academy ? academyLinks : studioLinks;
  const primaryCta = academy
    ? { href: "/contact?intent=academy", label: "Enrol now" }
    : { href: "/contact", label: site.ctaLabel || "Start a project" };
  const secondaryCta = academy
    ? { href: "/work", label: "See the work" }
    : { href: "/academy", label: "Browse courses" };

  const isActive = (href) => current === href || (href !== "/" && String(current).startsWith(`${href}/`));

  function close() {
    if (!open) return;
    setOpen(false);
    setClosing(true);
    clearTimeout(timer.current);
    const closeMs = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur"),
    ) || 150;
    timer.current = setTimeout(() => setClosing(false), closeMs);
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    clearTimeout(timer.current);
    setClosing(false);
    setOpen(true);
  }

  useEffect(() => {
    const outside = (event) => {
      if (!root.current?.contains(event.target)) close();
    };
    const key = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
      clearTimeout(timer.current);
    };
  });

  useEffect(() => {
    if (!open || window.innerWidth >= 768) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("portfolio-menu-change", { detail: { open } }));
    return () => window.dispatchEvent(new CustomEvent("portfolio-menu-change", { detail: { open: false } }));
  }, [open]);

  return (
    <header className="site-header" ref={root}>
      <div className="identity-wrap">
        <Link href="/" className="identity">
          <ProfileAvatar className="profile-image" src={site.profileImage} width={40} height={40} sizes="(max-width: 767px) 32px, 40px" style={{ objectPosition: profilePosition }} alt={`${site.creatorName} profile`} initials={initials} priority />
          <span>{site.creatorName}</span>
          <span className="identity-badge">{academy ? "Academy" : "Studio"}</span>
        </Link>
        <button
          className="menu-trigger"
          type="button"
          onClick={toggle}
          aria-controls="site-navigation"
          aria-expanded={open}
          aria-label={open ? "Close site navigation" : "Open site navigation"}
        >
          <ChevronDownIcon open={open} />
        </button>
        <div className={`mobile-menu-layer ${open ? "is-open" : ""} ${closing ? "is-closing" : ""}`}>
          <div className="mobile-menu-glass">
            <nav
              id="site-navigation"
              className={`t-dropdown public-menu mobile-nav-menu ${open ? "is-open" : ""} ${closing ? "is-closing" : ""}`}
              data-origin="top-left"
              aria-label="Site navigation"
              aria-hidden={!open}
            >
            {links.map((link) => (
              <span className="t-tt-wrap mobile-nav-item" key={link.href}>
                <Link
                  href={link.href}
                  className={`t-tt-trigger ${isActive(link.href) ? "is-active" : ""}`}
                  aria-label={link.label}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={close}
                >
                  <AdminIcon name={link.icon} />
                  <span className="menu-label">{link.label}</span>
                </Link>
                <span className="t-tt" role="tooltip">{link.label}</span>
              </span>
            ))}
            {site.instagramUrl && (
              <span className="t-tt-wrap menu-social">
                <a className="t-tt-trigger" href={site.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" tabIndex={open ? 0 : -1} onClick={close}>
                  <SocialIcon name="instagram" />
                  <span className="menu-label">Instagram</span>
                </a>
                <span className="t-tt" role="tooltip">Instagram</span>
              </span>
            )}
            {site.youtubeUrl && (
              <span className="t-tt-wrap menu-social">
                <a className="t-tt-trigger" href={site.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube" tabIndex={open ? 0 : -1} onClick={close}>
                  <SocialIcon name="youtube" />
                  <span className="menu-label">YouTube</span>
                </a>
                <span className="t-tt" role="tooltip">YouTube</span>
              </span>
            )}
            </nav>
          </div>
        </div>
      </div>
      {/* desktop: a plain list of links, with the academy panel as a hover and
          focus disclosure. no custom arrow-key handling, so Tab just works. */}
      <nav className="header-actions" aria-label="Primary">
        <div className="header-links">
          {links.map((link) =>
            link.children ? (
              <div className="header-dropdown" key={link.href}>
                <span className="header-dropdown-trigger">
                  <Link href={link.href} className={isActive(link.href) ? "is-active" : ""} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>
                  <span className="header-dropdown-caret" aria-hidden="true">▼</span>
                </span>
                <div className="header-dropdown-panel">
                  {link.children.map((child) => (
                    <Link className="header-dropdown-item" href={child.href} key={`${child.href}-${child.label}`}>
                      <span>{child.label}</span>
                      {child.description ? <small>{child.description}</small> : null}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={link.href} href={link.href} className={isActive(link.href) ? "is-active" : ""} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>
            ),
          )}
        </div>
        <Link className="header-secondary" href={secondaryCta.href}>{secondaryCta.label}</Link>
        <Link className="header-cta" href={primaryCta.href}>{primaryCta.label}<AdminIcon name="arrow" /></Link>
      </nav>
    </header>
  );
}
