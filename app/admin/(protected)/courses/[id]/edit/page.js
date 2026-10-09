import { notFound } from "next/navigation";
import { PageHeader } from "@/Components/DashboardPageShell";
import CourseWorkspace from "@/Components/CourseWorkspace";
import { loadCourseWorkspace } from "@/lib/data/course-workspace";
export default async function EditCoursePage({params,searchParams}){const [{id},query]=await Promise.all([params,searchParams]);const initial=await loadCourseWorkspace(id);if(!initial)notFound();return <><PageHeader title="Course workspace" eyebrow="COURSES" description="Edit, save privately, preview and publish from one place."/><CourseWorkspace initial={initial} initialStep={["details","pricing","curriculum","materials","preview","publish"].includes(query.step)?query.step:"details"}/></>;}
