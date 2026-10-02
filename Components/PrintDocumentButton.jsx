"use client";

// the document stylesheet isolates .print-document, so this prints just the
// certificate or invoice rather than the whole page
export default function PrintDocumentButton({ label = "Print", className = "button button-secondary" }) {
  return <button className={className} type="button" onClick={() => window.print()}>{label}</button>;
}
