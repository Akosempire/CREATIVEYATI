"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/Components/Icons";
import LearnSession from "@/Components/LearnSession";

// The same shell as the admin dashboard: same grid, same near-black sidebar, the
// same collapse and the same mobile overlay. It reuses the .admin-shell classes
// deliberately, so the two dashboards cannot drift into looking like two products.
const LINKS = [
  { href: "/learn", label: "Dashboard", icon: "home" },
  { href: "/learn#courses", label: "My courses", icon: "book" },
  { href: "/learn/certificates", label: "Certificates", icon: "award" },
  { href: "/learn#orders", label: "Orders", icon: "folder" },
];

const STORAGE_KEY = "cy-learn-sidebar";

export default function StudentShell({ site, user, signOut, children }) {
  const shell = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "collapsed") shell.current?.classList.add("is-collapsed");
    } catch {
      // an expanded sidebar is a fine default
    }
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      const element = shell.current;
      if (element?.classList.contains("is-nav-open")) {
        element.classList.remove("is-nav-open");
        element.querySelector(".admin-nav-trigger")?.setAttribute("aria-expanded", "false");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
  }

  function toggleNav() {
    const element = shell.current;
    if (!element) return;
    const open = element.classList.toggle("is-nav-open");
    element.querySelector(".admin-nav-trigger")?.setAttribute("aria-expanded", String(open));
  }

  return <div className="admin-shell" ref={shell}>
    <aside>
      <div className="admin-shell-head">
        <Link className="wordmark" href="/learn">{site?.creatorName || "Learning"}</Link>
        <button className="admin-shell-toggle" type="button" onClick={toggle} aria-label="Collapse sidebar" title="Collapse sidebar"><AdminIcon name="arrow" /></button>
        <button className="admin-nav-close" type="button" onClick={toggleNav} aria-label="Close navigation">X</button>
      </div>
      <nav aria-label="Student navigation">
        {LINKS.map((link) => {
          const active = pathname === link.href || (link.href !== "/learn" && pathname.startsWith(link.href.split("#")[0]) && pathname !== "/learn");
          return <Link className={active ? "is-active" : undefined} href={link.href} key={link.href} aria-current={active ? "page" : undefined}>
            <AdminIcon name={link.icon} />
            {link.label}
          </Link>;
        })}
      </nav>
      {user?.email ? <p className="admin-shell-email">{user.email}</p> : null}
      <LearnSession signOut={signOut} />
    </aside>
    <button className="admin-nav-scrim" type="button" onClick={toggleNav} aria-label="Close navigation" tabIndex={-1} />
    <button className="admin-nav-trigger" type="button" onClick={toggleNav} aria-expanded="false" aria-label="Open navigation">MENU</button>
    <section className="admin-main">{children}</section>
  </div>;
}
