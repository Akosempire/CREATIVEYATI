import { redirect } from "next/navigation";
import AdminShell from "@/Components/AdminShell";
import { getAdminUser, getAdminIdentity } from "@/lib/supabase/server";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

// Auth only. The shell owns the sidebar, so this stays a server component and
// every dashboard page underneath is untouched by the redesign.
export default async function ProtectedAdminLayout({ children }) {
  if (!(await getAdminIdentity())) redirect("/admin/login");
  if (!(await getAdminUser())) redirect("/admin/mfa");
  return <AdminShell logout={logout}>{children}</AdminShell>;
}
