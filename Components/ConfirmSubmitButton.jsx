"use client";
import { useFormStatus } from "react-dom";

export default function ConfirmSubmitButton({ children, message, className = "button button-danger", formAction }) {
  const { pending } = useFormStatus();
  return <button className={className} formAction={formAction} type="submit" disabled={pending} aria-busy={pending || undefined} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{pending ? "Working…" : children}</button>;
}
