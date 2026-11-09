"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { RollLabel } from "./GridNav";

const ease = [0.22, 1, 0.36, 1];

// built from the services page so the panel never drifts from what's offered
const SERVICES = [
  ["Film", ["AI commercials", "Brand films", "Product videos", "Creative direction", "Storyboards", "AI production"]],
  ["Social", ["Short-form video", "UGC-style concepts", "Launch content", "Campaign assets", "Social formats"]],
  ["Post", ["Video editing", "Sound design", "Colour & finishing", "Final delivery"]],
];

// budget bands are easy to change here; they go straight into the enquiry record
const BUDGETS = ["Under $1k", "$1k–3k", "$3k–10k", "$10k+"];

const CLOSER = [["FOR", "sans"], ["AMBITIOUS", "display"], ["BRANDS READY", "sans"], ["TO BE WATCHED", "display"]];

export default function AboutSheet({ section, about, socialLinks, projects, onClose, onProject }) {
  const scroller = useRef(null);
  const contactRef = useRef(null);
  const closeRef = useRef(null);

  // contact + "start a project" land on the form
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (section === "contact" && contactRef.current && scroller.current) {
        const box = scroller.current.getBoundingClientRect();
        const top = contactRef.current.getBoundingClientRect().top - box.top + scroller.current.scrollTop - 24;
        scroller.current.scrollTo({ top, behavior: "smooth" });
      } else {
        scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
      closeRef.current?.focus({ preventScroll: true });
    }, 380);
    return () => window.clearTimeout(t);
  }, [section]);

  const index = useMemo(
    () => projects.map((p, i) => ({ ...p, i })).sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );

  const fullName = String(about.creatorName || "").toUpperCase();

  return <>
    <motion.div
      className="gh-scrim"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    />
    <motion.aside
      className="gh-about"
      role="dialog"
      aria-modal="true"
      aria-label="About and contact"
      initial={{ x: "100%" }}
      animate={{ x: "0%", transition: { duration: 0.75, ease } }}
      exit={{ x: "100%", transition: { duration: 0.45, ease: [0.64, 0, 0.78, 0] } }}
    >
      <div className="gh-about-bar">
        <span className="gh-label">{section === "contact" ? "Contact" : "About"}</span>
        <button type="button" ref={closeRef} className="gh-close" onClick={onClose} aria-label="Close panel"><span>Close</span><kbd>Esc</kbd></button>
      </div>

      <div className="gh-about-scroll" ref={scroller}>
        <header className="gh-about-head">
          <motion.h2 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.25, duration: 0.8, ease } }}>
            I AM <span>{fullName}</span>
          </motion.h2>
          <div className="gh-about-id">
            <img src={about.profileImage} alt={`${about.creatorName} portrait`} style={{ objectPosition: about.profileFocal }} />
            <p>{about.professionalTitle}{about.availability ? <><br /><span>{about.availability}</span></> : null}</p>
          </div>
        </header>

        <div className="gh-about-copy">
          {(about.paragraphs.length ? about.paragraphs : ["A bird's-eye view of the work: AI commercials, product films and campaigns, laid out like a light table."]).map((text) => <p key={text.slice(0, 24)}>{text}</p>)}
        </div>

        <div className="gh-services">
          {SERVICES.map(([title, items]) => <div key={title}>
            <h3>{title}</h3>
            <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>)}
        </div>
        <p className="gh-learn">I also teach AI video creation. <Link href="/academy">Visit the Academy</Link> or <Link href="/courses">browse courses</Link>.</p>

        <section className="gh-reach" ref={contactRef} id="contact" aria-labelledby="gh-reach-title">
          <h3 id="gh-reach-title">Big idea? <em>You know where to find me.</em></h3>
          <dl>
            {about.email && <><dt>Email</dt><dd><a href={`mailto:${about.email}`}>{about.email}</a></dd></>}
            {about.phone && <><dt>Phone</dt><dd><a href={`tel:${about.phone.replace(/\s+/g, "")}`}>{about.phone}</a></dd></>}
            {about.bookingUrl && <><dt>Book</dt><dd><a href={about.bookingUrl} target="_blank" rel="noreferrer">30-minute intro call ↗</a></dd></>}
            {socialLinks.length > 0 && <><dt>Social</dt><dd className="gh-socials">{socialLinks.filter((s) => s.platform !== "email").map((s) => <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>)}</dd></>}
          </dl>
          <EnquiryForm />
        </section>

        <p className="gh-closer" aria-label="For ambitious brands ready to be watched">
          {CLOSER.map(([word, voice], i) => <motion.span
            key={word}
            className={`gh-closer-${voice}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease } }}
            viewport={{ root: scroller, once: true, amount: 0.6 }}
          >{word}</motion.span>)}
        </p>

        <section className="gh-index" aria-labelledby="gh-index-title">
          <h3 id="gh-index-title" className="gh-label">Projects A–Z</h3>
          <ol>
            {index.map((p) => <li key={p.id}>
              <button type="button" onClick={() => onProject(p.i)}>
                <span>{p.name}</span><small>{p.client}</small>
              </button>
            </li>)}
          </ol>
        </section>
      </div>
    </motion.aside>
  </>;
}

function EnquiryForm() {
  const [state, setState] = useState({ status: "idle", message: "", errors: {} });
  const busy = state.status === "sending";

  function validate(form) {
    const errors = {};
    const f = form.elements;
    if (!f.name.value.trim()) errors.name = "Enter your name.";
    if (!f.email.value.trim() || !f.email.validity.valid) errors.email = "Enter a valid email.";
    if (!f.company.value.trim()) errors.company = "Enter your company.";
    if (!f.phone.value.trim()) errors.phone = "Enter a phone number.";
    if (!f.budget.value) errors.budget = "Pick a budget.";
    if (!f.message.value.trim()) errors.message = "Tell me a little about the project.";
    if (!f.consent.checked) errors.consent = "Please confirm I can contact you.";
    return errors;
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const errors = validate(form);
    if (Object.keys(errors).length) {
      setState({ status: "error", message: "Check the highlighted fields.", errors });
      form.elements[Object.keys(errors)[0]]?.focus?.();
      return;
    }
    setState({ status: "sending", message: "", errors: {} });
    try {
      const res = await fetch("/api/enquiries", { method: "POST", body: new FormData(form) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldErrors = Object.fromEntries(Object.entries(payload.fieldErrors || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
        setState({ status: "error", message: payload.error || "Unable to send right now.", errors: fieldErrors });
        return;
      }
      form.reset();
      setState({ status: "success", message: payload.message || "Thanks! Your enquiry is in.", errors: {} });
    } catch {
      setState({ status: "error", message: "Unable to send right now. Please try again.", errors: {} });
    }
  }

  const err = (k) => state.errors[k] ? <small className="gh-err" id={`gh-${k}-err`}>{state.errors[k]}</small> : null;
  const aria = (k) => ({ "aria-invalid": Boolean(state.errors[k]), "aria-describedby": state.errors[k] ? `gh-${k}-err` : undefined });

  return <form className="gh-form" onSubmit={submit} noValidate aria-busy={busy}>
    <input name="website" tabIndex={-1} autoComplete="off" className="gh-honey" aria-hidden="true" />
    <label>Name*<input name="name" autoComplete="name" {...aria("name")} />{err("name")}</label>
    <label>Email*<input name="email" type="email" autoComplete="email" {...aria("email")} />{err("email")}</label>
    <label>Company*<input name="company" autoComplete="organization" maxLength={120} {...aria("company")} />{err("company")}</label>
    <label>Phone*<input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} {...aria("phone")} />{err("phone")}</label>
    <fieldset className="gh-budget" {...aria("budget")}>
      <legend>Budget*</legend>
      {BUDGETS.map((b) => <label key={b}><input type="radio" name="budget" value={b} /><span>{b}</span></label>)}
      {err("budget")}
    </fieldset>
    <label className="gh-wide">Tell me about the project<textarea name="message" rows={4} {...aria("message")} />{err("message")}</label>
    <label className="gh-consent"><input type="checkbox" name="consent" {...aria("consent")} /><span>I agree to be contacted about this enquiry.</span>{err("consent")}</label>
    <motion.button type="submit" className="gh-cta" disabled={busy} initial="rest" animate="rest" whileHover="hover" whileFocus="hover" whileTap={{ scale: 0.97 }}>
      <RollLabel>{busy ? "Sending…" : "Let’s connect!"}</RollLabel>
    </motion.button>
    {state.message && <p className={`gh-form-msg is-${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
