"use client";

import { useEffect, useRef } from "react";
import "@/Components/site/kit.css";

// primary cta: 3-arrow track that slides on hover, and a soft canvas of drifting
// white dots that fades in underneath the label. no particles under reduced motion.
export function ArrowTrack() {
  return <span className="bk-arrows" aria-hidden="true"><span>→</span><span>→</span><span>→</span></span>;
}

function useParticles(ref) {
  useEffect(() => {
    const host = ref.current;
    const canvas = host?.querySelector("canvas");
    if (!host || !canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let dots = [];
    let running = false;
    const size = () => {
      const r = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: Math.round(r.width / 6) }, () => ({ x: Math.random() * r.width, y: Math.random() * r.height, r: Math.random() * 0.9 + 0.3, vx: (Math.random() - 0.5) * 0.25, vy: -Math.random() * 0.35 - 0.05, a: Math.random() }));
    };
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bw = host.clientWidth, bh = host.clientHeight;
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy; d.a += 0.02;
        if (d.y < -2) { d.y = bh + 2; d.x = Math.random() * bw; }
        if (d.x < -2) d.x = bw + 2; else if (d.x > bw + 2) d.x = -2;
        ctx.globalAlpha = 0.35 + Math.sin(d.a) * 0.3;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (running) return; running = true; size(); raf = requestAnimationFrame(draw); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    host.addEventListener("pointerenter", start);
    host.addEventListener("focusin", start);
    host.addEventListener("pointerleave", stop);
    host.addEventListener("focusout", stop);
    return () => { stop(); host.removeEventListener("pointerenter", start); host.removeEventListener("focusin", start); host.removeEventListener("pointerleave", stop); host.removeEventListener("focusout", stop); };
  }, [ref]);
}

export default function BookButton({ href, children = "Book a call", className = "" }) {
  const ref = useRef(null);
  useParticles(ref);
  const external = /^https?:/.test(href || "");
  return <a ref={ref} className={`bk ${className}`} href={href || "/#contact"} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
    <canvas aria-hidden="true" />
    <span className="bk-label">{children}</span>
    <ArrowTrack />
  </a>;
}
