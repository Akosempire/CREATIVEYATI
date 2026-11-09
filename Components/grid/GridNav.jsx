"use client";

import Link from "next/link";
import { motion } from "motion/react";

const roll = {
  rest: { y: "0%" },
  hover: { y: "-100%" },
};
const rollIn = {
  rest: { y: "100%" },
  hover: { y: "0%" },
};
const rollEase = { duration: 0.42, ease: [0.22, 1, 0.36, 1] };

export function RollLabel({ children }) {
  return <span className="gh-roll">
    <motion.span className="gh-roll-a" variants={roll} transition={rollEase}>{children}</motion.span>
    <motion.span className="gh-roll-b" variants={rollIn} transition={rollEase} aria-hidden="true">{children}</motion.span>
  </span>;
}

// about + contact open sheets on the grid; the rest are real pages
export default function GridNav({ active, menuOpen, onWork, onAbout, onContact, onStart, onMenu }) {
  const links = [["work", "Work", onWork], ["services", "Services", "/services"], ["academy", "Academy", "/academy"], ["courses", "Courses", "/courses"], ["about", "About", onAbout], ["contact", "Contact", onContact]];
  return <header className="gh-nav">
    <Link className="gh-wordmark" href="/" aria-label="AI Video Creator, home" onClick={(e) => { e.preventDefault(); onWork(); }}>
      <i aria-hidden="true">AI</i><b>AI Video</b><span>Creator</span>
    </Link>

    <nav className="gh-pill" aria-label="Primary">
      {links.map(([key, label, action]) => {
        const inner = <>
          {active === key && <motion.span layoutId="gh-pill-active" className="gh-pill-bg" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="gh-pill-label">{label}</span>
        </>;
        return typeof action === "string"
          ? <Link key={key} href={action}>{inner}</Link>
          : <button type="button" key={key} className={active === key ? "is-active" : ""} aria-current={active === key ? "page" : undefined} onClick={action}>{inner}</button>;
      })}
    </nav>

    <div className="gh-actions">
    <Link className="gh-account" href="/login">Sign in</Link>
    <motion.button type="button" className="gh-cta" onClick={onStart} initial="rest" animate="rest" whileHover="hover" whileFocus="hover" whileTap={{ scale: 0.97 }}>
      <RollLabel>Start a project</RollLabel>
      <span className="gh-cta-arrow" aria-hidden="true">↗</span>
    </motion.button>
    </div>

    <button type="button" className={`gh-menu-btn${menuOpen ? " is-open" : ""}`} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="gh-menu" onClick={onMenu}>
      <span /><span />
    </button>
  </header>;
}
