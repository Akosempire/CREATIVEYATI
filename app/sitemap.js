import { getPublishedCourses } from "@/lib/data/courses";
import { getPublicPortfolio } from "@/lib/data/public";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const origin = "https://aivideocreator.cv";
  const [courses, {videos}] = await Promise.all([getPublishedCourses(),getPublicPortfolio()]);
  return [
    ...["", "/services", "/about", "/academy", "/courses"].map(path => ({url:origin+path,changeFrequency:path==="/courses"||path===""?"weekly":"monthly",priority:path===""?1:.8})),
    ...courses.map(course => ({url:`${origin}/courses/${encodeURIComponent(course.slug)}`, ...(course.updatedAt ? {lastModified:course.updatedAt}:{}),changeFrequency:"weekly",priority:.7})),
    ...videos.map(video => ({url:`${origin}/work/${encodeURIComponent(video.slug)}`,changeFrequency:"monthly",priority:.7})),
  ];
}
