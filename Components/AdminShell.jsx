"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import AdminNavigation from "@/Components/AdminNavigation";
import { AdminIcon } from "@/Components/Icons";

const STORAGE_KEY = "cy-admin-sidebar";

// The shell is a grid whose first column is the sidebar width, so collapsing
// animates exactly one property — grid-template-columns — at the sidebar motion
// token. The collapsed state lives on the shell element and persists across
// visits.
//
// It is applied through the DOM rather than React state on purpose: state would
// have to be read in an effect (a cascading render, and the hydration mismatch
// that comes with reading storage during render). Nothing else re-renders when
// the sidebar collapses, so there is no state to hold.
export default function AdminShell({ logout, children }) {
  const shell = useRef(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "collapsed") shell.current?.classList.add("is-collapsed");
    } catch {
      // storage can be unavailable; an expanded sidebar is a fine default
    }
  }, []);

  function toggle() {
    const element = shell.current;
    if (!element) return;
    const collapsed = element.classList.toggle("is-collapsed");
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "expanded");
    } catch {
      // preference simply will not persist
    }
    const button = element.querySelector(".admin-shell-toggle");
    if (button) {
      button.setAttribute("aria-expanded", String(!collapsed));
      button.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      button.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
    }
  }

  // below 900px the sidebar becomes an overlay sheet rather than a column, so
  // opening it is a different action from collapsing it and gets its own class
  function toggleNav() {
    const element = shell.current;
    if (!element) return;
    const open = element.classList.toggle("is-nav-open");
    element.querySelector(".admin-nav-trigger")?.setAttribute("aria-expanded", String(open));
  }

  return <div className="admin-shell" ref={shell}>
    <aside>
      <div className="admin-shell-head">
        <Link className="wordmark" href="/admin">FRAME / MOTION</Link>
        <button
          className="admin-shell-toggle"
          type="button"
          onClick={toggle}
          aria-expanded="true"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <AdminIcon name="arrow" />
        </button>
      </div>
      <AdminNavigation />
      <form action={logout}><button type="submit"><AdminIcon name="logout" />Log out</button></form>
    </aside>
    <button className="admin-nav-trigger" type="button" onClick={toggleNav} aria-expanded="false" aria-label="Open navigation">☰</button>
    <section className="admin-main">{children}</section>
  </div>;
}
