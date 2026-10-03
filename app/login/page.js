import Link from "next/link";
import { getSiteContent } from "@/lib/data/site";
import { studentSignIn } from "@/app/student-actions";
import SubmitButton from "@/Components/SubmitButton";

export const metadata = { title: "Student sign in" };
export const dynamic = "force-dynamic";

// Two panels on desktop: the dark brand side, and the form. Below 900px the dark
// panel is hidden and the form stands alone under a small wordmark, because on a
// phone the form is the whole job.
export default async function LoginPage({ searchParams }) {
  const [site, query] = await Promise.all([getSiteContent(), searchParams]);
  const next = query.next || "/learn";
  const brand = site.creatorName || "FRAME / MOTION";

  return <div className="fm-auth">
    <aside className="fm-auth-aside">
      <span className="fm-auth-brand">{brand}</span>
      <div>
        <h2>Learn by making films.</h2>
        <p>Every course walks you from a brief to a finished cut, and the certificate at the end is yours to keep.</p>
      </div>
      <span className="fm-auth-frame" aria-hidden="true" />
    </aside>
    <main className="fm-auth-main">
      <div className="fm-auth-card">
        <span className="fm-auth-logo">{brand}</span>
        <p className="fm-auth-label">STUDENT ACCESS</p>
        <h1>Sign in</h1>
        <p className="fm-auth-lede">Pick up where you left off.</p>
        {query.message && <p className="success-note">{query.message}</p>}
        {query.error && <p className="form-error">{query.error}</p>}
        <form className="admin-form fm-auth-form" action={studentSignIn}>
          <input type="hidden" name="next" value={next} />
          <label>Email<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <p className="fm-auth-forgot"><Link className="inline-link" href="/reset-password">Forgot password?</Link></p>
          <SubmitButton className="button fm-auth-submit" pendingLabel="Signing in...">Sign in</SubmitButton>
        </form>
        <p className="fm-auth-alt">New here? <Link className="inline-link" href={"/register?next=" + encodeURIComponent(next)}>Create an account</Link></p>
      </div>
    </main>
  </div>;
}
