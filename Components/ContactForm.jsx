"use client";

import { useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

const initialState = { loading: false, message: "", status: "idle", errors: {} };

// label swap on submit: old text lifts out, new text rises in (motion)
function ButtonLabel({ loading }) {
  const text = loading ? "Sending…" : "Send enquiry";
  return <span className="t-text-swap" style={{ display: "inline-grid", overflow: "hidden" }}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={text} style={{ gridArea: "1 / 1" }} initial={{ y: "100%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>{text}</motion.span>
    </AnimatePresence>
  </span>;
}

function clientErrors(form) {
  const errors = {};
  if (!form.elements.name.value.trim()) errors.name = "Enter your name.";
  const email = form.elements.email.value.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!form.elements.email.validity.valid) errors.email = "Enter a valid email address.";
  if (!form.elements.message.value.trim()) errors.message = "Tell me a little about your project.";
  if (!form.elements.consent.checked) errors.consent = "Confirm that you agree to be contacted.";
  return errors;
}

export default function ContactForm() {
  const [state, setState] = useState(initialState);
  const submittingRef = useRef(false);

  function clearFieldError(event) {
    const name = event.currentTarget.name;
    setState((current) => current.errors[name] ? { ...current, errors: { ...current.errors, [name]: undefined }, message: current.status === "error" ? "" : current.message, status: current.status === "error" ? "idle" : current.status } : current);
  }

  async function submit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    const form = event.currentTarget;
    const errors = clientErrors(form);
    if (Object.keys(errors).length) {
      setState({ loading: false, message: "Check the highlighted fields.", status: "error", errors });
      form.elements[Object.keys(errors)[0]]?.focus();
      return;
    }

    submittingRef.current = true;
    setState({ loading: true, message: "", status: "idle", errors: {} });
    try {
      const response = await fetch("/api/enquiries", { method: "POST", body: new FormData(form) });
      const payload = await response.json();
      if (!response.ok) {
        const fieldErrors = Object.fromEntries(Object.entries(payload.fieldErrors || {}).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
        setState({ loading: false, message: payload.error || "Unable to send your enquiry.", status: "error", errors: fieldErrors });
        return;
      }
      form.reset();
      setState({ loading: false, message: payload.message || "Thanks — your enquiry has been received.", status: "success", errors: {} });
    } catch {
      setState({ loading: false, message: "Unable to send your enquiry. Please try again.", status: "error", errors: {} });
    } finally {
      submittingRef.current = false;
    }
  }

  return <MotionConfig reducedMotion="user"><form className="contact-form" onSubmit={submit} noValidate aria-busy={state.loading}>
    <input name="website" tabIndex="-1" autoComplete="off" className="honeypot" aria-hidden="true" />
    <label className="contact-field">Name <span>(required)</span><input required name="name" autoComplete="name" onInput={clearFieldError} aria-invalid={Boolean(state.errors.name)} aria-describedby={state.errors.name ? "contact-name-error" : undefined} />{state.errors.name && <small id="contact-name-error" className="contact-field-error">{state.errors.name}</small>}</label>
    <label className="contact-field">Email <span>(required)</span><input required name="email" type="email" autoComplete="email" onInput={clearFieldError} aria-invalid={Boolean(state.errors.email)} aria-describedby={state.errors.email ? "contact-email-error" : undefined} />{state.errors.email && <small id="contact-email-error" className="contact-field-error">{state.errors.email}</small>}</label>
    <label className="contact-field">Phone number <span>(optional)</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength="40" /></label>
    <label className="contact-field">Project type <span>(optional)</span><input name="projectType" autoComplete="off" maxLength="100" /></label>
    <label className="contact-field form-wide">Tell me about your project <span>(required)</span><textarea required name="message" rows="5" onInput={clearFieldError} aria-invalid={Boolean(state.errors.message)} aria-describedby={state.errors.message ? "contact-message-error" : undefined} />{state.errors.message && <small id="contact-message-error" className="contact-field-error">{state.errors.message}</small>}</label>
    <label className="consent"><input required name="consent" type="checkbox" onChange={clearFieldError} aria-invalid={Boolean(state.errors.consent)} aria-describedby={state.errors.consent ? "contact-consent-error" : undefined} /><span>I agree to be contacted about this enquiry.</span></label>
    {state.errors.consent && <small id="contact-consent-error" className="contact-field-error consent-error">{state.errors.consent}</small>}
    <button className="button contact-submit" disabled={state.loading} type="submit"><ButtonLabel loading={state.loading} /></button>
    {state.message && <p className={`contact-form-message is-${state.status}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">{state.message}</p>}
  </form></MotionConfig>;
}
