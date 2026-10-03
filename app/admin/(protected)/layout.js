import { redirect } from "next/navigation";
import AdminShell from "@/Components/AdminShell";
import { getAdminUser } from "@/lib/supabase/server";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

// Auth only. The shell owns the sidebar, so this stays a server component and
// every dashboard page underneath is untouched by the redesign.
export default async function ProtectedAdminLayout({ children }) {
  if (!(await getAdminUser())) redirect("/admin/login");
  return <AdminShell logout={logout}>{children}</AdminShell>;
}
