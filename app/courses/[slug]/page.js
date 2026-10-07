import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import PublicHeader from "@/Components/PublicHeader";
import PublicFooter from "@/Components/PublicFooter";
import CourseVideoPlayer from "@/Components/CourseVideoPlayer";
import { getSiteContent } from "@/lib/data/site";
import { getPublicCourse, coursePrice, formatMoney } from "@/lib/data/courses";
import { getPublicSocialLinks } from "@/lib/data/social";
import { getStudentUser, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) { const { slug } = await params; const course = await getPublicCourse(slug); return course ? { title: course.seoTitle || course.title, description: course.seoDescription || course.shortDescription, openGraph: { images: course.ogImageUrl || course.coverImageUrl ? [course.ogImageUrl || course.coverImageUrl] : [] } } : {}; }

// durations are stored in seconds and are only rendered when they exist, so a
// lesson with no recorded length simply shows no time
function lessonDuration(seconds) {
  if (!seconds || seconds <= 0) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default async function CoursePage({ params }) {
  const { slug } = await params; const [course, site, socialLinks] = await Promise.all([getPublicCourse(slug), getSiteContent(), getPublicSocialLinks()]); if (!course) notFound(); const price = coursePrice(course);
  // an owner is never sold the same course twice: the CTA becomes a way in
  const user = await getStudentUser(); const service = createSupabaseServiceClient();
  const { data: enrolment } = user && service ? await service.from("enrolments").select("id").eq("student_id", user.id).eq("course_id", course.id).eq("active", true).maybeSingle() : { data: null };
  const modules = course.sections || [];
  const lessonCount = modules.reduce((total, section) => total + section.lessons.length, 0);
  const cta = enrolment ? { href: `/learn/${course.slug}`, label: "Continue learning" }
    : price === 0 ? { href: `/checkout/${course.id}`, label: "Enrol free" }
    : { href: `/checkout/${course.id}`, label: "Enrol in course" };

  return <main className="public-page"><PublicHeader site={site} current="/courses" /><article className="course-detail public-note">
    <div className="course-hero">
      <div className="course-hero-info">
        <Link className="inline-link course-back" href="/courses">Back to courses</Link>
        <p className="eyebrow">{course.category || "COURSE"}</p>
        <h1 className="page-title">{course.title}</h1>
        <p className="public-lede">{course.shortDescription}</p>
        <dl className="course-meta">
          <div><dt>Instructor</dt><dd>{course.instructor || site.creatorName}</dd></div>
          <div><dt>Level</dt><dd>{course.difficulty}</dd></div>
          <div><dt>Language</dt><dd>{course.language}</dd></div>
          <div><dt>Contents</dt><dd>{modules.length} module{modules.length === 1 ? "" : "s"} / {lessonCount} lesson{lessonCount === 1 ? "" : "s"}</dd></div>
          {course.estimatedDuration && <div><dt>Duration</dt><dd>{course.estimatedDuration}</dd></div>}
        </dl>
      </div>

      <aside className="course-enrol" aria-label="Enrolment">
        <Image src={course.coverImageUrl} style={{ objectPosition: `${course.coverFocalX}% ${course.coverFocalY}%` }} alt={`${course.title} cover`} width={960} height={540} sizes="(max-width: 1024px) 90vw, 480px" unoptimized />
        <div className="course-enrol-body">
          <strong className="course-price">{price === 0 ? "Free" : formatMoney(price, course.currency)}</strong>
          <Link className="button" href={cta.href}>{cta.label}</Link>
          <ul className="course-enrol-facts">
            <li>{modules.length} module{modules.length === 1 ? "" : "s"}</li>
            <li>{lessonCount} lesson{lessonCount === 1 ? "" : "s"}</li>
            {course.estimatedDuration && <li>{course.estimatedDuration}</li>}
          </ul>
        </div>
      </aside>
    </div>

    {course.promotionalEmbedUrl && <section className="course-promo-video"><h2>Course preview</h2><CourseVideoPlayer lesson={{ id: "promo", title: `${course.title} promotional video`, sourceType: course.promotionalVideoSource, embedUrl: course.promotionalEmbedUrl, orientation: course.promotionalOrientation, aspectRatio: course.promotionalAspectRatio }} /></section>}
    <section className="course-description"><h2>About this course</h2>{course.description.split(/\n\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>
    {course.learningOutcomes.length > 0 && <section className="course-outcomes"><h2>What you will learn</h2><ul>{course.learningOutcomes.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
    {course.requirements.length > 0 && <section className="course-requirements"><h2>Requirements</h2><ul>{course.requirements.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
    {course.targetAudience.length > 0 && <section className="course-audience"><h2>Who this is for</h2><ul>{course.targetAudience.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
    <section className="course-curriculum"><h2>Curriculum</h2>
      {modules.length ? <div className="curriculum-modules">
        {modules.map((section) => <details className="curriculum-module" key={section.id} open={modules.length === 1}>
          <summary>
            <span className="curriculum-module-title">{section.title}</span>
            <span className="curriculum-module-side">
              <span className="curriculum-module-meta">{section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}</span>
              <span className="curriculum-module-toggle" aria-hidden="true" />
            </span>
          </summary>
          {section.description && <p className="course-section-description">{section.description}</p>}
          <div className="curriculum-lesson-list">
            {section.lessons.map((lesson) => <p key={lesson.id}>
              <span>{lesson.title}</span>
              <span className="curriculum-lesson-meta">
                {lessonDuration(lesson.durationSeconds) && <small>{lessonDuration(lesson.durationSeconds)}</small>}
                {lesson.isPreview ? <Link href={`/courses/${course.slug}/preview/${lesson.id}`}>Preview</Link> : <small>Enrolled students</small>}
              </span>
            </p>)}
          </div>
        </details>)}
      </div> : <p>Curriculum details will be published soon.</p>}
    </section>
    {course.materials?.length > 0 && <section className="course-preview-materials"><h2>Preview materials</h2>{course.materials.map((resource) => <p key={resource.id}><a className="inline-link" href={`/api/learn/resources/${resource.id}`} target="_blank" rel="noreferrer">{resource.title}</a>{resource.description && <small>{resource.description}</small>}</p>)}</section>}
  </article><PublicFooter site={site} socialLinks={socialLinks} /></main>;
}
