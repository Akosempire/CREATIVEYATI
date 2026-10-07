import Link from "next/link";
import { createSupabaseServerClient, getAdminUser } from "@/lib/supabase/server";
import { readDashboardRows } from "@/lib/data/dashboard";

export default async function StudentsPage({ searchParams }) {
  if (!await getAdminUser()) throw new Error("Administrator access required.");
  const params = await searchParams;
  const search = String(params.q || "").trim().slice(0, 100).replace(/[%_]/g, "");
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page, 10) || 1));
  const db = await createSupabaseServerClient();
  let query = db.from("student_profiles").select("id,full_name,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("id");
  if (search) query = query.ilike("full_name", `%${search}%`);
  const { data, count, error } = await query.range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error("Students could not be loaded. Please try again.");
  const ids = data.map(row => row.id);
  const enrolments = ids.length ? await readDashboardRows(() => db.from("enrolments").select("id,student_id,course_id,courses(title)").in("student_id", ids).eq("active", true).order("id")) : [];
  const pageLink = number => `/admin/students?q=${encodeURIComponent(search)}&page=${number}`;
  return <><div className="admin-title"><p>ACADEMY</p><h1>Students</h1><p>{count} registered students{search ? " matching your search" : ""}</p></div><form className="admin-form compact" action="/admin/students"><label>Search by name<input name="q" defaultValue={search} maxLength={100}/></label><button className="button">Search students</button></form><div className="admin-list">{data.map(student => <div key={student.id}><span><strong>{student.full_name || "Student"}</strong><small>Joined {new Date(student.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</small></span><span>{enrolments.filter(row => row.student_id === student.id).map(row => <p key={row.id}><Link href={`/admin/courses/${row.course_id}/students`}>{row.courses?.title || "View course enrolment"}</Link></p>)}</span></div>)}</div>{!data.length && <p>No students found.</p>}<nav className="admin-actions" aria-label="Student pages">{page > 1 && <Link className="button button-secondary" href={pageLink(page - 1)}>Previous</Link>}{page * 25 < count && <Link className="button button-secondary" href={pageLink(page + 1)}>Next</Link>}</nav></>;
}
