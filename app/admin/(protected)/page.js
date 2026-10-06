import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/data/courses";
import { getBachsConfiguration } from "@/lib/payments/provider";
import { getAdminFinanceSummary } from "@/lib/data/finance";

export default async function AdminHome() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Dashboard data is unavailable.");
  const [publishedResult, draftsResult, enquiriesResult, coursesResult, studentsResult, ordersResult, failedResult, finance] = await Promise.all([
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "published").is("deleted_at", null),
    supabase.from("student_profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("payment_status", "successful"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("payment_status", "failed"),
    getAdminFinanceSummary(),
  ]);
  if ([publishedResult, draftsResult, enquiriesResult, coursesResult, studentsResult, ordersResult, failedResult].some(result => result.error || result.count == null)) {
    throw new Error("Dashboard counts could not be loaded. Please try again.");
  }
  const payments = await getBachsConfiguration();
  const stats = [["Published projects", publishedResult.count],["Draft projects", draftsResult.count],["New enquiries", enquiriesResult.count],["Published courses", coursesResult.count],["Total students", studentsResult.count],["Successful orders", ordersResult.count],["Failed payments", failedResult.count], ...finance.orders.map(row => [`Course revenue (${row.currency})`, formatMoney(row.collected_minor, row.currency)])];
  return <><div className="admin-title"><p>OVERVIEW</p><h1>Keep the work moving.</h1></div>{!payments.ready && <Link className="dashboard-alert" href="/admin/payments"><strong>Payments need configuration</strong><span>Open Payments to see the missing Bachs deployment secrets.</span></Link>}<div className="stats">{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="admin-actions"><Link className="button" href="/admin/videos/new">Add project</Link><Link href="/admin/videos">Reorder portfolio</Link><Link href="/admin/courses/new">Add course</Link><Link href="/admin/orders">View orders</Link><Link href="/admin/enquiries">View enquiries</Link></div></>;
}
