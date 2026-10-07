import Image from "next/image";
import DataTable from "@/Components/DataTable";
import Badge, { toneForStatus } from "@/Components/Badge";
import { PageHeader } from "@/Components/DashboardPageShell";
import Link from "next/link";
import { formatMoney, getAdminCourses } from "@/lib/data/courses";

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();
  return <>
    <PageHeader title={<>Courses</>} eyebrow={<>COURSES</>} description={<>Manage courses, modules, lessons and publishing.</>} actions={<><Link className="button" href="/admin/courses/new">Create course</Link></>}/>
    <DataTable label="Courses" emptyTitle="No courses yet" emptyDescription="Create a course to start building its curriculum."><div><b>Course</b><b>Category</b><b>Price</b><b>Status</b><b>Actions</b></div>{courses.map(course => <div key={course.id}><span className="dashboard-course-identity">{course.coverImageUrl && <Image src={course.coverImageUrl} alt="" width={64} height={44} unoptimized/>}<span><strong>{course.title}</strong>{course.instructor && <small>{course.instructor}</small>}{course.updatedAt && <small>Updated {new Date(course.updatedAt).toLocaleDateString("en-NG")}</small>}</span></span><span>{course.category || "Uncategorised"}</span><span>{course.isFree ? "Free" : formatMoney(course.priceMinor, course.currency)}</span><Badge tone={toneForStatus(course.status)}>{course.status}</Badge><span className="course-row-actions"><Link className="inline-link" href={`/admin/courses/${course.id}/students`}>Students</Link><Link className="inline-link" href={`/admin/courses/${course.id}/edit`}>Edit</Link><Link className="inline-link" href={`/admin/courses/${course.id}/curriculum`}>Curriculum</Link><Link className="inline-link" href={`/admin/courses/${course.id}/materials`}>Materials</Link><Link className="inline-link" href={`/admin/courses/${course.id}/preview`}>Preview</Link><Link className="inline-link" href={`/admin/courses/${course.id}/edit?step=publish`}>Publish</Link></span></div>)}</DataTable>
  </>;
}
