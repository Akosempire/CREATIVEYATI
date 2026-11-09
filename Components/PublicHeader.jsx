"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import SiteMotion from "./site/SiteMotion";
import "./site/site-language.css";

// one nav for every public + sign-in page, same voice as the homepage grid:
// wordmark, glass pill with a sliding ink marker, lime "start a project" with a text roll.

const links = [["/", "Work"], ["/services", "Services"], ["/academy", "Academy"], ["/courses", "Courses"], ["/about", "About"], ["/contact", "Contact"]];

const roll = { rest: { y: "0%" }, hover: { y: "-100%" } };
const rollIn = { rest: { y: "100%" }, hover: { y: "0%" } };
const rollEase = { duration: 0.42, ease: [0.22, 1, 0.36, 1] };

function Roll({ children }) {
  return <span className="sl-roll">
    <motion.span variants={roll} transition={rollEase}>{children}</motion.span>
    <motion.span variants={rollIn} transition={rollEase} aria-hidden="true">{children}</motion.span>
  </span>;
}

const lineIn = {
  hidden: { y: "110%", opacity: 0 },
  show: (i) => ({ y: "0%", opacity: 1, transition: { delay: 0.1 + i * 0.055, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
  exit: { y: "-30%", opacity: 0, transition: { duration: 0.18 } },
};

export default function PublicHeader({ signedIn = false }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const isActive = (href) => href === "/" ? pathname === "/" || pathname === "/work" || pathname.startsWith("/work/") : pathname === href || pathname.startsWith(`${href}/`);
  const account = signedIn ? ["/learn", "My learning"] : ["/login", "Sign in"];

  // the old carousel listens for this; keep the contract
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("portfolio-menu-change", { detail: { open } }));
    document.documentElement.classList.toggle("sl-menu-open", open);
    if (!open) return undefined;
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    const resize = () => { if (window.innerWidth >= 1100) setOpen(false); };
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("resize", resize); };
  }, [open]);

  return <MotionConfig reducedMotion="user">
    <header className="sl-nav">
      <Link href="/" className="sl-wordmark" aria-label="AI Video Creator home" onClick={() => setOpen(false)}>
        <b>AI Video</b><span>Creator</span>
      </Link>

      <nav className="sl-pill" aria-label="Primary">
        {links.map(([href, label]) => {
          const on = isActive(href);
          return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={on ? "is-active" : ""}>
            {on && <motion.span layoutId="sl-pill-active" className="sl-pill-bg" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="sl-pill-label">{label}</span>
          </Link>;
        })}
      </nav>

      <div className="sl-actions">
        <Link className="sl-account" href={account[0]}>{account[1]}</Link>
        <motion.div initial="rest" animate="rest" whileHover="hover" whileFocus="hover" whileTap={{ scale: 0.97 }} className="sl-cta-wrap">
          <Link className="sl-cta" href="/contact"><Roll>Start a project</Roll><span aria-hidden="true">↗</span></Link>
        </motion.div>
      </div>

      <button type="button" className={`sl-menu-btn${open ? " is-open" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="sl-menu" onClick={() => setOpen((v) => !v)}>
        <span /><span />
      </button>
    </header>

    <AnimatePresence>
      {open && <motion.div
        id="sl-menu"
        className="sl-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
        animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)", transition: { duration: 0.42, ease: [0.64, 0, 0.78, 0] } }}
      >
        <nav aria-label="Mobile navigation">
          {[...links, account, ["/verify", "Verify a certificate"]].map(([href, label], i) => <span className="sl-menu-line" key={href}>
            <motion.span custom={i} variants={lineIn} initial="hidden" animate="show" exit="exit" style={{ display: "block" }}>
              <Link href={href} onClick={() => setOpen(false)} aria-current={isActive(href) ? "page" : undefined} className={i >= links.length ? "is-small" : ""}>
                {label}<sup>{String(i + 1).padStart(2, "0")}</sup>
              </Link>
            </motion.span>
          </span>)}
        </nav>
        <Link className="sl-cta sl-menu-cta" href="/contact" onClick={() => setOpen(false)}>Start a project <span aria-hidden="true">↗</span></Link>
      </motion.div>}
    </AnimatePresence>

    <SiteMotion />
  </MotionConfig>;
}
