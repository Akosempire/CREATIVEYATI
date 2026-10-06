"use client";

export default function ConfirmSubmitButton({ children, message, className, formAction }) {
  return <button className={className} formAction={formAction} type="submit" onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
