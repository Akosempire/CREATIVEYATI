"use client";

import { useRef } from "react";
import useDashboardShell from "@/Components/useDashboardShell";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/Components/Icons";
import LearnSession from "@/Components/LearnSession";

// The same shell as the admin dashboard: same grid, same near-black sidebar, the
// same collapse and the same mobile overlay. It reuses the .admin-shell classes
// deliberately, so the two dashboards cannot drift into looking like two products.
const LINKS = [
  { href: "/learn", label: "Dashboard", icon: "home" },
  { href: "/learn/courses", label: "My courses", icon: "book" },
  { href: "/learn/certificates", label: "Certificates", icon: "award" },
  { href: "/learn/orders", label: "Orders", icon: "folder" },
  { href: "/learn/profile", label: "Profile", icon: "user" },
];

const STORAGE_KEY = "cy-learn-sidebar";

export default function StudentShell({ site, user, signOut, children }) {
  const shell = useRef(null);
  const pathname = usePathname();

  const { toggle, toggleNav } = useDashboardShell(shell, STORAGE_KEY, pathname);
  function isActive(href) {
    if (href === "/learn/courses") return pathname === href || (pathname.startsWith("/learn/") && !LINKS.some(link => link.href === pathname));
    return pathname === href;
  }
  return <div className="admin-shell student-shell" ref={shell}>
    <aside>
      <div className="admin-shell-head">
        <Link className="wordmark" href="/learn">{site?.creatorName || "Learning"}</Link>
        <button className="admin-shell-toggle" type="button" onClick={toggle} aria-label="Collapse sidebar" title="Collapse sidebar"><AdminIcon name="arrow" /></button>
        <button className="admin-nav-close" type="button" onClick={toggleNav} aria-label="Close navigation">X</button>
      </div>
      <nav aria-label="Student navigation">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return <Link className={active ? "is-active" : undefined} href={link.href} key={link.href} title={link.label} aria-current={active ? "page" : undefined}>
            <AdminIcon name={link.icon} />
            <span>{link.label}</span>
          </Link>;
        })}
      </nav>
      {user?.email ? <p className="admin-shell-email">{user.email}</p> : null}
      <LearnSession signOut={signOut} />
    </aside>
    <button className="admin-nav-scrim" type="button" onClick={toggleNav} aria-label="Close navigation" tabIndex={-1} />
    <button className="admin-nav-trigger" type="button" onClick={toggleNav} aria-expanded="false" aria-label="Open navigation">MENU</button>
    <section className="admin-main">{children}</section>
    <nav className="student-bottom-nav" aria-label="Learning shortcuts">{LINKS.map(link => <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}><AdminIcon name={link.icon}/><span>{link.label}</span></Link>)}</nav>
  </div>;
}

