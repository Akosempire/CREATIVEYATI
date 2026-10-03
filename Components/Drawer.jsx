"use client";

import { useRef } from "react";
import { AdminIcon } from "@/Components/Icons";

// The drawer the dashboards were missing. A right-hand sheet on a native dialog,
// so Escape and focus handling come from the platform rather than from us.
// Use it for detail that would otherwise be crushed into a table cell.
export default function Drawer({ label, trigger = "View", triggerClassName = "inline-link", children, width }) {
  const dialog = useRef(null);
  const triggerRef = useRef(null);

  function open() {
    dialog.current?.showModal();
  }

  // returning focus to the trigger is what the platform will not do for us
  function close() {
    dialog.current?.close();
    triggerRef.current?.focus();
  }

  return <>
    <button ref={triggerRef} className={triggerClassName} type="button" onClick={open}>{trigger}</button>
    <dialog
      ref={dialog}
      className="drawer-dialog"
      aria-label={label}
      style={width ? { width: `min(${width}, 92vw)` } : undefined}
    >
      <div className="drawer-body">
        <header className="drawer-head">
          <h2>{label}</h2>
          <button className="drawer-close" type="button" onClick={close} aria-label="Close">
            <AdminIcon name="arrow" />
          </button>
        </header>
        <div className="drawer-content">{children}</div>
      </div>
    </dialog>
  </>;
}
