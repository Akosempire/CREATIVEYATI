"use client";

import { useLayoutEffect, useRef } from "react";
import { animate, inView, stagger } from "motion";
import SplitType from "split-type";

// line-by-line text reveal for [data-reveal] blocks: each line rises out of a
// mask and unblurs as it scrolls into view. motion's inView + animate (was gsap).
export default function PublicTextReveal({ children, as: Tag = "div", className = "" }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let cancelled = false;
    const splits = [];
    const stops = [];

    const setup = () => {
      if (cancelled) return;
      element.querySelectorAll("[data-reveal]").forEach((target) => {
        const split = new SplitType(target, { types: "lines", tagName: "span", lineClass: "text-reveal-line" });
        splits.push(split);
        split.lines.forEach((line) => {
          const mask = document.createElement("span");
          mask.className = "text-reveal-mask";
          line.parentNode?.insertBefore(mask, line);
          mask.appendChild(line);
          line.style.opacity = "0";
          line.style.transform = "translateY(112%)";
          line.style.filter = "blur(8px)";
        });
        stops.push(inView(target, () => {
          animate(split.lines, { opacity: 1, transform: "translateY(0%)", filter: "blur(0px)" }, { duration: 0.82, delay: stagger(0.075), ease: [0.22, 1, 0.36, 1] });
        }, { margin: "0px 0px -20% 0px" }));
      });
    };

    if (document.fonts?.ready) document.fonts.ready.then(setup);
    else setup();

    return () => {
      cancelled = true;
      stops.forEach((stop) => stop?.());
      splits.forEach((split) => split.revert());
    };
  }, []);

  return <Tag className={className} ref={root}>{children}</Tag>;
}
