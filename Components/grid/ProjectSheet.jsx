"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";

const ease = [0.22, 1, 0.36, 1];

export default function ProjectSheet({ project, color, onClose }) {
  const closeRef = useRef(null);
  // wait for the camera to land before taking focus
  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 500);
    return () => window.clearTimeout(t);
  }, []);
  if (!project) return null;
  const frames = [...new Set(project.images)];

  return <motion.section
    className="gh-project"
    role="dialog"
    aria-modal="false"
    aria-labelledby="gh-project-title"
    initial={{ y: "105%" }}
    animate={{ y: "0%", transition: { delay: 0.35, duration: 0.8, ease } }}
    exit={{ y: "105%", transition: { duration: 0.45, ease: [0.64, 0, 0.78, 0] } }}
    style={{ "--gh-brand": color }}
  >
    <div className="gh-project-bar">
      <span className="gh-label"><i style={{ background: color }} />{project.client || "Selected work"}{project.year ? ` · ${project.year}` : ""}</span>
      <button type="button" ref={closeRef} className="gh-close" onClick={onClose} aria-label="Close project">
        <span>Close</span><kbd>Esc</kbd>
      </button>
    </div>
    <div className="gh-project-body">
      <div className="gh-project-copy">
        <motion.h2 id="gh-project-title" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.55, duration: 0.7, ease } }}>{project.name}</motion.h2>
        <ul className="gh-tags">{project.services.map((s) => <li key={s}>{s}</li>)}</ul>
        {project.blurb && <p>{project.blurb}</p>}
        <Link className="gh-cta gh-cta-dark" href={project.caseStudyUrl}>Watch the case study <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="gh-gallery">
        {frames.map((src, i) => <motion.figure
          key={src}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.6 + i * 0.08, duration: 0.6, ease } }}
        >
          <img src={src} alt={i === 0 ? `${project.name} still` : ""} loading="lazy" />
        </motion.figure>)}
      </div>
    </div>
  </motion.section>;
}
