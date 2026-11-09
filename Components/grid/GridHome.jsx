"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import GridNav from "./GridNav";
import ProjectSheet from "./ProjectSheet";
import AboutSheet from "./AboutSheet";
import "./grid-home.css";

// ink or paper over a brand colour, whichever reads
function readableOn(hex) {
  const v = parseInt(String(hex || "#174c38").slice(1), 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? "#0d0d0c" : "#f7f5f1";
}

export default function GridHome({ projects, ticker, about, socialLinks, accent, notice }) {
  const reduce = useReducedMotion();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const coordX = useRef(null);
  const coordY = useRef(null);
  const titleRef = useRef(null);

  const [hover, setHover] = useState(null);
  const [active, setActive] = useState(null);
  const [sheet, setSheet] = useState(null); // null | "about" | "contact"
  const [menuOpen, setMenuOpen] = useState(false);
  const [colors, setColors] = useState(() => projects.map(() => accent));
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const [focusIndex, setFocusIndex] = useState(null);

  // ---- custom cursor ----
  const cx = useMotionValue(-100);
  const cy = useMotionValue(-100);
  const sx = useSpring(cx, { stiffness: 520, damping: 42, mass: 0.6 });
  const sy = useSpring(cy, { stiffness: 520, damping: 42, mass: 0.6 });
  useEffect(() => {
    const move = (e) => { cx.set(e.clientX); cy.set(e.clientY); };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [cx, cy]);

  // ---- engine ----
  const handlers = useRef({});
  // ---- open / close ----
  const closeProject = useCallback(() => {
    setActive(null);
    engineRef.current?.release();
  }, []);

  // latest callbacks for the engine, refreshed after each render
  useEffect(() => {
    handlers.current = {
    onHover: (i) => setHover(i),
    onSelect: (i) => { setActive(i); setFocusIndex(null); },
    onRequestClose: () => closeProject(),
    onColors: (list) => setColors(list),
    onIntroDone: () => setReady(true),
    onFrame: (frame) => {
      if (coordX.current) coordX.current.textContent = frame.x.toFixed(6);
      if (coordY.current) coordY.current.textContent = frame.y.toFixed(6);
      const el = titleRef.current;
      if (!el) return;
      if (frame.hover) {
        el.style.opacity = String(frame.hover.amount);
        el.style.transform = `translate3d(${frame.hover.x}px, ${frame.hover.y}px, 0) translate(-50%, -50%) scale(${0.96 + 0.04 * frame.hover.amount})`;
      } else {
        el.style.opacity = "0";
      }
    },
    };
  });

  useEffect(() => {
    if (!projects.length || !canvasRef.current) return;
    let engine;
    let cancelled = false;
    import("@/lib/grid/engine").then(({ createGridEngine }) => {
      if (cancelled) return;
      try {
        engine = createGridEngine(canvasRef.current, {
          projects,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onHover: (i) => handlers.current.onHover(i),
          onSelect: (i) => handlers.current.onSelect(i),
          onRequestClose: () => handlers.current.onRequestClose(),
          onColors: (list) => handlers.current.onColors(list),
          onIntroDone: () => handlers.current.onIntroDone(),
          onFrame: (f) => handlers.current.onFrame(f),
        });
        engineRef.current = engine;
      } catch {
        setWebgl(false);
      }
    });
    const resize = () => engineRef.current?.resize();
    window.addEventListener("resize", resize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      engine?.destroy();
      engineRef.current = null;
    };
  }, [projects]);

  const openSheet = useCallback((kind) => {
    setMenuOpen(false);
    if (active !== null) closeProject();
    setSheet(kind);
  }, [active, closeProject]);

  const closeSheet = useCallback(() => setSheet(null), []);

  const goWork = useCallback(() => {
    setMenuOpen(false);
    setSheet(null);
    if (active !== null) closeProject();
  }, [active, closeProject]);

  useEffect(() => {
    engineRef.current?.setDimmed(Boolean(sheet) || menuOpen);
  }, [sheet, menuOpen]);

  useEffect(() => {
    const key = (e) => {
      if (e.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      else if (sheet) setSheet(null);
      else if (active !== null) closeProject();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [menuOpen, sheet, active, closeProject]);

  // from the a-z index or the keyboard list: fly there, optionally open it
  const flyTo = useCallback((index, open) => {
    if (sheet) {
      setSheet(null);
      window.setTimeout(() => engineRef.current?.flyToProject(index, { open }), reduce ? 0 : 420);
    } else {
      engineRef.current?.flyToProject(index, { open });
    }
  }, [sheet, reduce]);

  const navActive = sheet === "about" ? "about" : sheet === "contact" ? "contact" : "work";
  const hoverColor = hover !== null ? colors[hover] || accent : accent;
  const tickerLine = useMemo(() => ticker.join("  •  "), [ticker]);
  const showCursor = hover !== null && !sheet && active === null;

  return <MotionConfig reducedMotion="user">
    <main className="gh-root">
      <h1 className="gh-sr">Idayat Ibrahim: AI video creator portfolio</h1>

      <canvas ref={canvasRef} className={`gh-canvas${ready ? " is-ready" : ""}`} aria-hidden="true" />
      {!webgl && <FallbackGrid projects={projects} onOpen={(i) => setActive(i)} />}
      {notice && <p className="gh-notice">{notice}</p>}

      {/* hover title, positioned every frame by the engine */}
      <div className="gh-hover-title" ref={titleRef} aria-hidden="true" style={{ color: readableOn(hoverColor) }}>
        {hover !== null && <>
          <span className="gh-hover-client">{projects[hover]?.client}</span>
          <span className="gh-hover-name">{projects[hover]?.name}</span>
        </>}
      </div>

      <motion.div className="gh-cursor" aria-hidden="true" style={{ x: sx, y: sy }}>
        <motion.span
          className="gh-cursor-dot"
          initial={false}
          animate={{ scale: showCursor ? 1 : 0, opacity: showCursor ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          style={{ background: readableOn(hoverColor) === "#0d0d0c" ? "#0d0d0c" : "#f7f5f1", color: readableOn(hoverColor) === "#0d0d0c" ? "#f7f5f1" : "#0d0d0c" }}
        >View</motion.span>
      </motion.div>

      <div className="gh-grain" aria-hidden="true" />

      <GridNav
        active={navActive}
        menuOpen={menuOpen}
        onWork={goWork}
        onAbout={() => openSheet("about")}
        onContact={() => openSheet("contact")}
        onStart={() => openSheet("contact")}
        onMenu={() => setMenuOpen((v) => !v)}
      />

      {/* the instrument readouts */}
      <div className="gh-coords" aria-hidden="true">
        <span className="gh-coord gh-coord-x"><em>X</em><b ref={coordX}>0.000000</b></span>
        <span className="gh-coord gh-coord-y"><em>Y</em><b ref={coordY}>0.000000</b></span>
      </div>

      <div className="gh-foot" aria-hidden={Boolean(sheet)}>
        <span className="gh-hint">Drag · Scroll · Click</span>
        <div className="gh-ticker" role="marquee" aria-label="Studio news">
          <div className="gh-ticker-window">
            <div className="gh-ticker-track" style={{ "--gh-ticker-dur": `${Math.max(28, tickerLine.length * 0.22)}s` }}>
              <span>{tickerLine}  •  </span>
              <span aria-hidden="true">{tickerLine}  •  </span>
            </div>
          </div>
        </div>
        <span className="gh-count">{String(projects.length).padStart(2, "0")} projects</span>
      </div>

      {/* keyboard + seo: every project as a real link. focus flies the camera */}
      <nav className="gh-sr gh-a11y" aria-label="Projects">
        <ul>
          {projects.map((p, i) => <li key={p.id}>
            <a
              href={p.caseStudyUrl}
              onFocus={() => { setFocusIndex(i); flyTo(i, false); }}
              onBlur={() => setFocusIndex((v) => (v === i ? null : v))}
              onClick={(e) => { e.preventDefault(); flyTo(i, true); }}
            >{p.name}{p.client ? `, ${p.client}` : ""}</a>
          </li>)}
        </ul>
      </nav>
      <AnimatePresence>
        {focusIndex !== null && active === null && <motion.p
          className="gh-focus-chip"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          aria-hidden="true"
        >{String(focusIndex + 1).padStart(2, "0")} / {projects[focusIndex]?.name} <span>Enter to open</span></motion.p>}
      </AnimatePresence>

      <AnimatePresence>
        {active !== null && <ProjectSheet
          key={projects[active]?.id}
          project={projects[active]}
          color={colors[active] || accent}
          onClose={closeProject}
        />}
      </AnimatePresence>

      <AnimatePresence>
        {sheet && <AboutSheet
          key="about"
          section={sheet}
          about={about}
          socialLinks={socialLinks}
          projects={projects}
          onClose={closeSheet}
          onProject={(i) => flyTo(i, true)}
        />}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && <MobileMenu
          onWork={goWork}
          onAbout={() => openSheet("about")}
          onContact={() => openSheet("contact")}
          onClose={() => setMenuOpen(false)}
        />}
      </AnimatePresence>
    </main>
  </MotionConfig>;
}

const menuItem = {
  hidden: { y: "110%", opacity: 0 },
  show: (i) => ({ y: "0%", opacity: 1, transition: { delay: 0.08 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
  exit: { y: "-40%", opacity: 0, transition: { duration: 0.2 } },
};

function MobileMenu({ onWork, onAbout, onContact, onClose }) {
  const items = [
    ["Work", onWork], ["Services", "/services"], ["Academy", "/academy"], ["Courses", "/courses"],
    ["About", onAbout], ["Contact", onContact], ["Sign in", "/login"], ["Verify a certificate", "/verify"],
  ];
  return <motion.div
    className="gh-menu"
    id="gh-menu"
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
    initial={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
    animate={{ clipPath: "circle(150% at calc(100% - 40px) 40px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
    exit={{ clipPath: "circle(0% at calc(100% - 40px) 40px)", transition: { duration: 0.45, ease: [0.64, 0, 0.78, 0] } }}
  >
    <nav aria-label="Mobile">
      {items.map(([label, action], i) => <span className="gh-menu-line" key={label}>
        <motion.span custom={i} variants={menuItem} initial="hidden" animate="show" exit="exit" style={{ display: "block" }}>
          {typeof action === "string"
            ? <Link href={action} onClick={onClose}>{label}<sup>{String(i + 1).padStart(2, "0")}</sup></Link>
            : <button type="button" onClick={action}>{label}<sup>{String(i + 1).padStart(2, "0")}</sup></button>}
        </motion.span>
      </span>)}
    </nav>
    <p className="gh-menu-foot">AI commercials · Product films · UGC</p>
  </motion.div>;
}

// no webgl: a plain grid of covers so the work is still there
function FallbackGrid({ projects, onOpen }) {
  return <div className="gh-fallback">
    {projects.map((p, i) => <button type="button" key={p.id} onClick={() => onOpen(i)}>
      <img src={p.images[0]} alt="" loading="lazy" />
      <span>{p.name}</span>
    </button>)}
  </div>;
}
