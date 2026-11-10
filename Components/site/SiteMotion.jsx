"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { animate, inView, stagger } from "motion";
import { ENTER } from "@/lib/motion/enter";

// page-level motion shared by every public page:
// 1. blocks below the fold rise in as they enter (motion's inView + animate)

const REVEAL = [
  "main section > :is(h2, h3, p, ul, ol, figure, img, article, div)",
  "main article",
  "main figure",
  ".public-page :is(.svc-card, .avc-course-card, .course-card, .work-card, .about-section, .catalog-support, .svc-process li, .avc-step-grid > *)",
  ".public-footer > *",
].join(",");



export default function SiteMotion() {
  const pathname = usePathname() || "/";

  // ---- entrance: rise + unblur, staggered, once per page ----
  // layout effect: on client navigations this runs before paint, so the start
  // state is set before anything shows. first loads are covered by the gate in layout.js.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { root.removeAttribute("data-sl-enter"); return undefined; }
    const targets = [...document.querySelectorAll(ENTER)].slice(0, 14);
    targets.forEach((el) => { el.style.opacity = "0"; });
    root.removeAttribute("data-sl-enter");
    const controls = targets.length
      ? animate(targets, { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"], filter: ["blur(4px)", "blur(0px)"] }, { duration: 0.6, delay: stagger(0.08, { startDelay: 0.05 }), ease: [0.22, 1, 0.36, 1] })
      : null;
    return () => { controls?.complete(); targets.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; el.style.filter = ""; }); };
  }, [pathname]);

  // ---- scroll reveal for blocks below the fold ----
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const fold = window.innerHeight * 0.92;
    const seen = new Set();
    const stops = [];
    // a small delay lets the page's own text reveals settle first
    const t = window.setTimeout(() => {
      document.querySelectorAll(REVEAL).forEach((el) => {
        if (seen.has(el) || el.matches(ENTER) || el.closest(".sl-nav, .sl-menu, .text-reveal-mask, [data-no-reveal]")) return;
        // skip anything inside an element we're already revealing
        for (const s of seen) if (s.contains(el)) return;
        if (el.getBoundingClientRect().top < fold) return;
        seen.add(el);
        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
        stops.push(inView(el, () => {
          animate(el, { opacity: 1, transform: "translateY(0px)" }, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
        }, { amount: 0.15 }));
      });
    }, 60);
    return () => {
      window.clearTimeout(t);
      stops.forEach((stop) => stop?.());
      seen.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
    };
  }, [pathname]);


  return null;
}
