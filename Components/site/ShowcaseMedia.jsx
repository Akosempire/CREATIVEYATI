"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "motion/react";
import ExternalVideoPlayer from "@/Components/ExternalVideoPlayer";
import { useVideoAspect } from "@/lib/video-aspect";

// a real project still filling its frame, with a play button that opens the
// film in a lightbox sized to the film's own shape (never forced to 16:9).
// falls back to the old placeholder when there is no published work yet.
export default function ShowcaseMedia({ item, fallbackSrc, fallbackAlt = "", priority = false, showPlay = true, showCredit = true }) {
  const [open, setOpen] = useState(false);
  if (!item) return <img className="sc-still" src={fallbackSrc} alt={fallbackAlt} loading={priority ? "eager" : "lazy"} decoding="async" />;
  return <>
    <img className="sc-still" src={item.poster} alt={item.alt} style={{ objectPosition: item.focal }} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
    {showCredit && <Link className="sc-credit" href={item.href}>{item.client ? `${item.client} · ` : ""}{item.title}</Link>}
    {showPlay && item.video && <button type="button" className="sc-play" onClick={() => setOpen(true)} aria-label={`Play ${item.title}`}>
      <span aria-hidden="true">▶</span> Play film
    </button>}
    {/* portal: animated ancestors would otherwise trap a fixed overlay */}
    {open && createPortal(<Lightbox item={item} onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function Lightbox({ item, onClose }) {
  const { ratio, orientation } = useVideoAspect(item.video, item.video.aspectRatio);
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e) => { if (e.key === "Escape") onClose(); };
    document.documentElement.classList.add("sl-menu-open");
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); document.documentElement.classList.remove("sl-menu-open"); };
  }, [onClose]);
  return <motion.div
    className="sc-lightbox"
    role="dialog"
    aria-modal="true"
    aria-label={`${item.title} video`}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  >
    <motion.div
      className="sc-frame"
      data-orientation={orientation}
      style={{ aspectRatio: ratio, width: `min(92vw, calc(72svh * ${ratio}))` }}
      initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }} exit={{ y: 20, opacity: 0 }}
    >
      <ExternalVideoPlayer video={item.video} orientation={orientation} />
    </motion.div>
    <div className="sc-lightbox-bar">
      <Link href={item.href}>{item.title} — view case study ↗</Link>
      <button type="button" ref={closeRef} onClick={onClose}>Close <kbd>Esc</kbd></button>
    </div>
  </motion.div>;
}
