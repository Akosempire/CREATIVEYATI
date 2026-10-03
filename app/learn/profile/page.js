import Link from "next/link";
import { updateStudentProfile } from "@/app/student-actions";
import { getStudentDashboard } from "@/lib/data/courses";
import SubmitButton from "@/Components/SubmitButton";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function StudentProfilePage({ searchParams }) {
  const [{ user, profile }, query] = await Promise.all([getStudentDashboard(), searchParams]);
  return <section className="public-note">
    <div className="admin-title"><p>MY LEARNING</p><h1>Profile</h1><p className="admin-lede">Your name appears on your certificate, so keep it as you want it printed.</p></div>
    {query.message && <p className="success-note">{query.message}</p>}
    {query.error && <p className="form-error">{query.error}</p>}
    <form className="admin-form" action={updateStudentProfile}>
      <label>Full name<input name="fullName" defaultValue={profile?.full_name || user?.user_metadata?.full_name || ""} required /><small>Shown on your certificates and in the dashboard greeting.</small></label>
      <label>Email<input value={user?.email || ""} disabled /><small>Contact support to change the email on your account.</small></label>
      <SubmitButton className="button" pendingLabel="Saving...">Save profile</SubmitButton>
    </form>
    <p><Link className="inline-link" href="/learn/certificates">My certificates</Link></p>
  </section>;
}
