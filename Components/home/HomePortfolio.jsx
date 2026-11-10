"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import TopBar, { Avatar } from "@/Components/site/TopBar";
import BookButton from "./BookButton";
import ContactForm from "@/Components/ContactForm";
import { CASE_STUDY_COUNT, HOME, SERVICES, TESTIMONIALS, TESTIMONIAL_MS } from "@/lib/content/home";
import "./home.css";

const ease = [0.22, 1, 0.36, 1];
const rise = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: (i) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: 0.1 + i * 0.08, duration: 0.6, ease } }),
};


export default function HomePortfolio({ site, projects, socialLinks }) {
  const cases = projects.slice(0, CASE_STUDY_COUNT);
  const shots = projects.slice(CASE_STUDY_COUNT);
  return <MotionConfig reducedMotion="user">
    <div className="hp">
      <aside className="hp-panel">
        <TopBar site={site} className="tb-in-panel" />
        <Intro site={site} />
        <div className="hp-hatch" aria-hidden="true" />
        <Testimonials />
      </aside>

      <main className="hp-stream" id="work" aria-label="Selected work">
        <h1 className="hp-sr">{HOME.title}</h1>
        {cases.map((p, i) => <CaseCard key={p.id} project={p} priority={i === 0} />)}
        <ServicesFrame />
        {shots.map((p) => <ShotTile key={p.id} project={p} site={site} />)}
        <AboutFrame site={site} />
        <ContactFrame site={site} socialLinks={socialLinks} />
        {!projects.length && <p className="hp-empty">New work is on its way.</p>}
      </main>
      <div className="hp-blur hp-blur-top" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hp-blur hp-blur-bottom" aria-hidden="true"><i /><i /><i /><i /></div>
    </div>
  </MotionConfig>;
}

// ---- intro ----
function Intro({ site }) {
  const whatsapp = site.phone ? `https://wa.me/${String(site.phone).replace(/[^\d]/g, "")}` : "";
  return <section className="hp-intro" aria-label="Introduction">
    <motion.p className="hp-badge" custom={0} variants={rise} initial="hidden" animate="show">
      <GlobeIcon /> <span>{HOME.badge[0]}</span> <b>{HOME.badge[1]}</b>
    </motion.p>
    <motion.p className="hp-h1" custom={1} variants={rise} initial="hidden" animate="show" role="heading" aria-level={2}>
      {HOME.headline[0]}<span>{HOME.headline[1]}</span>
    </motion.p>
    <motion.p className="hp-sub" custom={2} variants={rise} initial="hidden" animate="show">{HOME.subhead}</motion.p>
    <motion.div className="hp-ctas" custom={3} variants={rise} initial="hidden" animate="show">
      <BookButton href={site.bookingUrl} />
      {whatsapp && <a className="hp-wa" href={whatsapp} target="_blank" rel="noreferrer">Message on <WhatsAppIcon /><span className="hp-sr">WhatsApp</span></a>}
    </motion.div>
  </section>;
}

// ---- testimonials ----
function Testimonials() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduce || paused) return undefined;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), TESTIMONIAL_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, reduce]);
  const item = TESTIMONIALS[index];
  return <section className="hp-quotes" aria-label="What clients say" aria-roledescription="carousel" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <div className="hp-progress" role="tablist" aria-label="Choose a testimonial">
      {TESTIMONIALS.map((t, i) => <button key={t.name} type="button" role="tab" aria-selected={i === index} aria-label={`Testimonial from ${t.name}`} onClick={() => setIndex(i)}>
        <i className={i < index ? "is-done" : i === index ? (reduce || paused ? "is-done" : "is-live") : ""} style={{ animationDuration: `${TESTIMONIAL_MS}ms` }} key={i === index ? `live-${index}` : i} />
      </button>)}
    </div>
    <AnimatePresence mode="wait">
      <motion.figure key={item.name} initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(6px)" }} transition={{ duration: 0.5, ease }} aria-live="polite">
        <blockquote>“{item.quote}”</blockquote>
        <figcaption>
          <span className="hp-faces"><span className="hp-initial">{item.name.slice(0, 1)}</span></span>
          <span><b>{item.name}</b><small>{item.role}</small></span>
        </figcaption>
      </motion.figure>
    </AnimatePresence>
  </section>;
}

// ---- stream frames ----
// the frame takes the cover image's own shape, read from the image itself once it
// loads, so a 16:9 cover is never squeezed into a 9:16 box (or the reverse).
// the video's ratio is only the first guess while the image is on its way.
function Mockup({ project, priority }) {
  const [ratio, setRatio] = useState(project.ratio);
  const [loaded, setLoaded] = useState(false);
  const measure = (img) => {
    if (!img?.naturalWidth || !img.naturalHeight) return;
    setRatio(img.naturalWidth / img.naturalHeight);
    setLoaded(true);
  };
  return <span className="hp-mock-wrap"><motion.span layout transition={{ layout: { duration: 0.45, ease } }} className={`hp-mock${loaded ? " is-loaded" : ""}`} style={{ aspectRatio: ratio, "--ar": ratio }}>
    <img
      ref={(img) => { if (img?.complete && !loaded) measure(img); }}
      onLoad={(e) => measure(e.currentTarget)}
      src={project.poster} alt={project.alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async"
    />
  </motion.span></span>;
}

// ---- scroll motion + glass ----
// as a card travels through the viewport its mockup rises, grows to full size at
// the centre and eases off again; the blurred backdrop drifts the other way.
function useDrift(ref, strength = 1) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [70 * strength, -70 * strength]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], reduce ? [1, 1, 1] : [0.92, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.16], reduce ? [1, 1] : [0, 1]);
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  return { y, scale, opacity, bgY, reduce };
}

// the project's own cover, heavily blurred: every frame glows in its own colours
function Glass({ src, y }) {
  return <motion.span className="hp-glass" aria-hidden="true" style={{ y }}>
    <img src={src} alt="" loading="lazy" decoding="async" />
  </motion.span>;
}

// a slow idle float so the work keeps breathing when the page is still
function Float({ children, reduce, delay = 0 }) {
  return <motion.span className="hp-float" animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, delay }}>{children}</motion.span>;
}

function CaseCard({ project, priority }) {
  const ref = useRef(null);
  const { y, scale, opacity, bgY, reduce } = useDrift(ref);
  return <Link ref={ref} href={project.href} className="hp-case" aria-label={`${project.name}${project.client ? `, ${project.client}` : ""}: view case study`}>
    <Glass src={project.poster} y={bgY} />
    <motion.span className="hp-case-inner" style={{ y, scale, opacity }}>
      <Float reduce={reduce}><Mockup project={project} priority={priority} /></Float>
    </motion.span>
    <span className="hp-case-meta"><b>{project.name}</b>{project.client && <small>{project.client}</small>}</span>
    <span className="hp-pill">View case study <span className="hp-pill-arrow" aria-hidden="true">→</span></span>
  </Link>;
}

function ShotTile({ project, site }) {
  const ref = useRef(null);
  const { y, scale, opacity, bgY, reduce } = useDrift(ref, 0.6);
  return <figure ref={ref} className="hp-shot">
    <Link href={project.href} className="hp-shot-tile" aria-label={`${project.name}: view case study`}>
      <Glass src={project.poster} y={bgY} />
      <motion.span style={{ y, scale, opacity }} className="hp-shot-inner">
        <Float reduce={reduce} delay={1.5}><Mockup project={project} /></Float>
      </motion.span>
    </Link>
    <figcaption><Avatar src={site.profileImage} name={site.creatorName} size={16} /><b>{project.client || project.name}</b><span>Directed by {site.creatorName || "Idayat Ibrahim"}</span></figcaption>
  </figure>;
}

function ServicesFrame() {
  return <section className="hp-frame hp-services" id="services" aria-label="Services">
    <ol>
      {SERVICES.map((s, i) => <li key={s.title}>
        <span className="hp-num">{String(i + 1).padStart(2, "0")}</span>
        <div><h2>{s.title}</h2><p>{s.body}</p></div>
      </li>)}
    </ol>
  </section>;
}

function AboutFrame({ site }) {
  const paragraphs = [site.aboutCopy, site.aboutCurrentWork].filter(Boolean);
  return <section className="hp-frame hp-about" id="about" aria-label="About">
    <div className="hp-about-id">
      <Avatar src={site.profileImage} name={site.creatorName} size={72} />
      <p><b>{site.creatorName || "Idayat Ibrahim"}</b><span>{site.professionalTitle || "AI Video Creator"}</span></p>
    </div>
    <div className="hp-about-copy">{(paragraphs.length ? paragraphs : [HOME.subhead]).map((t) => <p key={t.slice(0, 30)}>{t}</p>)}</div>
  </section>;
}

function ContactFrame({ site, socialLinks }) {
  const [brief, setBrief] = useState(false);
  const whatsapp = site.phone ? `https://wa.me/${String(site.phone).replace(/[^\d]/g, "")}` : "";
  useEffect(() => {
    if (!brief) return undefined;
    const key = (e) => { if (e.key === "Escape") setBrief(false); };
    window.addEventListener("keydown", key);
    document.documentElement.classList.add("tb-locked");
    return () => { window.removeEventListener("keydown", key); document.documentElement.classList.remove("tb-locked"); };
  }, [brief]);
  return <section className="hp-frame hp-contact" id="contact" aria-label="Contact">
    <p className="hp-contact-line">Got a product, a launch or a story to tell?<span> Let&apos;s make the video.</span></p>
    <div className="hp-ctas">
      <BookButton href={site.bookingUrl} />
      {whatsapp && <a className="hp-wa" href={whatsapp} target="_blank" rel="noreferrer">Message on <WhatsAppIcon /><span className="hp-sr">WhatsApp</span></a>}
      <button type="button" className="hp-link" onClick={() => setBrief(true)}>Send a brief</button>
    </div>
    <ul className="hp-contact-meta">
      {site.publicEmail && <li><a href={`mailto:${site.publicEmail}`}>{site.publicEmail}</a></li>}
      {socialLinks.filter((s) => s.platform !== "email").map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}
      <li><Link href="/academy">Learn with me at the Academy</Link></li>
    </ul>
    <AnimatePresence>
      {brief && <>
        <motion.div className="tb-scrim" onClick={() => setBrief(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div className="hp-brief" role="dialog" aria-modal="true" aria-label="Send a brief" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.5, ease }}>
          <div className="hp-brief-bar"><b>Send a brief</b><button type="button" onClick={() => setBrief(false)} autoFocus>Close</button></div>
          <ContactForm />
        </motion.div>
      </>}
    </AnimatePresence>
  </section>;
}

// ---- icons ----
function GlobeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function WhatsAppIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" /></svg>;
}
