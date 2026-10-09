import { randomUUID } from "node:crypto";
import { PageHeader } from "@/Components/DashboardPageShell";
import CourseWorkspace from "@/Components/CourseWorkspace";
import { emptyCourse, UUID } from "@/lib/course-workspace";
import { getAdminUser } from "@/lib/supabase/server";
export default async function NewCoursePage({searchParams}){const query=await searchParams; const user=await getAdminUser();return <><PageHeader title="Create course" eyebrow="COURSES" description="Build at your own pace. Drafts are private."/><CourseWorkspace initial={{document:emptyCourse(UUID.test(query.draft || "")?query.draft:randomUUID()),revision:0,userId:user.id,isNew:true,status:"draft"}}/></>;}
