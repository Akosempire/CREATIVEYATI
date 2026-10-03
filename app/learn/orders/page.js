import Link from "next/link";
import { formatMoney, getStudentDashboard } from "@/lib/data/courses";
import Badge, { toneForStatus } from "@/Components/Badge";
import { EmptyState } from "@/Components/Feedback";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function StudentOrdersPage() {
  const { orders } = await getStudentDashboard();
  return <section className="public-note">
    <div className="admin-title"><p>MY LEARNING</p><h1>Orders</h1><p className="admin-lede">Every course purchase on your account, with the reference to quote if you need help.</p></div>
    {orders.length ? <div className="admin-table">
      <div><b>Course</b><b>Reference</b><b>Amount</b><b>Status</b><b>Date</b></div>
      {orders.map((order) => <div key={order.id}>
        <span>{order.courses?.title || "Course"}</span>
        <span>{order.reference}</span>
        <strong>{formatMoney(order.amount_minor, order.currency)}</strong>
        <span><Badge tone={toneForStatus(order.payment_status)}>{order.payment_status}</Badge></span>
        <span>{order.created_at ? new Date(order.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "-"}</span>
      </div>)}
    </div> : <EmptyState title="No purchases yet" action={<Link className="button" href="/courses">Browse courses</Link>}>When you enrol in a course, the order and its payment status appear here with a reference to quote.</EmptyState>}
  </section>;
}
