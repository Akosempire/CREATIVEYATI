"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import "./kit.css";

// shared top bar: avatar + name (letter roll on hover) and a 2-line menu.
// used inside the homepage panel and across the top of every other page.

export const MENU = [
  ["/#work", "Work"],
  ["/services", "Services"],
  ["/about", "About"],
  ["/#contact", "Contact"],
  ["/academy", "Academy"],
  ["/courses", "Courses"],
];

export function RollText({ text }) {
  return <span className="tb-roll" aria-label={text}>
    {[...text].map((ch, i) => <span className="tb-roll-ch" key={i} style={{ "--i": i }} aria-hidden="true">
      <span>{ch === " " ? " " : ch}</span>
      <span>{ch === " " ? " " : ch}</span>
    </span>)}
  </span>;
}

export function Avatar({ src, name, size = 32 }) {
  return <span className="tb-avatar" style={{ width: size, height: size }}>
    {src ? <img src={src} alt="" width={size} height={size} /> : <b>{String(name || "A").slice(0, 1)}</b>}
  </span>;
}

export default function TopBar({ site = {}, signedIn = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const firstLink = useRef(null);
  const name = site.creatorName || "Idayat Ibrahim";
  const booking = site.bookingUrl || "/#contact";

  useEffect(() => {
    document.documentElement.classList.toggle("tb-locked", open);
    if (!open) return undefined;
    firstLink.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") { setOpen(false); button.current?.focus(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const close = () => setOpen(false);
  // the sheet lives on <body> so no panel or blur layer can sit over it
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return <>
    <header className={`tb ${className}`}>
      <Link href="/" className="tb-id" onClick={close}>
        <Avatar src={site.profileImage} name={name} />
        <RollText text={name} />
      </Link>
      <button type="button" ref={button} className={`tb-burger${open ? " is-open" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="tb-sheet" onClick={() => setOpen((v) => !v)}>
        <span /><span />
      </button>
    </header>

    {mounted && createPortal(<AnimatePresence>
      {open && <>
        <motion.div className="tb-scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
        <motion.nav
          id="tb-sheet"
          className="tb-sheet"
          aria-label="Menu"
          initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ul>
            {MENU.map(([href, label], i) => <motion.li key={href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}>
              <Link href={href} ref={i === 0 ? firstLink : undefined} onClick={close}>{label}<span aria-hidden="true">→</span></Link>
            </motion.li>)}
          </ul>
          <div className="tb-sheet-foot">
            <Link href={signedIn ? "/learn" : "/login"} onClick={close}>{signedIn ? "My learning" : "Sign in"}</Link>
            <a className="tb-sheet-cta" href={booking} onClick={close} {...(booking.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>Book a call →</a>
          </div>
        </motion.nav>
      </>}
    </AnimatePresence>, document.body)}
  </>;
}
