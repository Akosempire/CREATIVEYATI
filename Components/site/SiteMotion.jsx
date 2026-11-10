"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { animate, inView } from "motion";

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

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const fold = window.innerHeight * 0.92;
    const seen = new Set();
    const stops = [];
    // a small delay lets the page's own text reveals settle first
    const t = window.setTimeout(() => {
      document.querySelectorAll(REVEAL).forEach((el) => {
        if (seen.has(el) || el.closest(".sl-nav, .sl-menu, .text-reveal-mask, [data-no-reveal]")) return;
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
