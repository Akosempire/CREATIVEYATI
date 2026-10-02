"use client";

import { useRef } from "react";
import { revokeCertificate } from "@/app/admin/actions";

// revoking is destructive and needs a reason, so it gets a real dialog instead
// of a cramped disclosure inside a table cell
export default function RevokeCertificateDialog({ id, serial }) {
  const dialog = useRef(null);

  return <>
    <button className="inline-link" type="button" onClick={() => dialog.current?.showModal()}>Revoke</button>
    <dialog
      ref={dialog}
      className="admin-dialog"
      aria-labelledby={`revoke-title-${id}`}
      onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}
    >
      <form className="admin-form" action={revokeCertificate}>
        <input type="hidden" name="id" value={id} />
        <h2 id={`revoke-title-${id}`}>Revoke {serial}?</h2>
        <p>The public verification page will report this certificate as revoked, with the reason below recorded. Anyone who checks the serial will see it.</p>
        <label>Reason<input name="reason" placeholder="Issued in error, chargeback, misconduct…" required /></label>
        <div className="admin-dialog-actions">
          <button className="button button-secondary" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          <button className="button" type="submit">Revoke certificate</button>
        </div>
      </form>
    </dialog>
  </>;
}
