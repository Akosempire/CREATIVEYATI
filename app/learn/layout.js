import { redirect } from "next/navigation";
import StudentShell from "@/Components/StudentShell";
import { getStudentUser } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data/site";
import { studentSignOut } from "@/app/student-actions";

export const dynamic = "force-dynamic";

// Auth and the shell only. The student area uses the same layout as the admin
// dashboard so the two read as one product.
export default async function LearnLayout({ children }) {
  const [user, site] = await Promise.all([getStudentUser(), getSiteContent()]);
  if (!user) redirect("/login?next=/learn");
  return <StudentShell site={site} user={user} signOut={studentSignOut}>{children}</StudentShell>;
}
