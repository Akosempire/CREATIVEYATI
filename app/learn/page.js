import Link from "next/link";
import Image from "next/image";
import { updateStudentProfile } from "@/app/student-actions";
import { formatMoney, getStudentDashboard } from "@/lib/data/courses";
import { getStudentCertificates } from "@/lib/data/certificates";
import { EmptyState } from "@/Components/Feedback";

export const metadata = { title: "My learning" };
export const dynamic = "force-dynamic";

function courseState(item) {
  const lessons = item.course?.sections.flatMap((section) => section.lessons) || [];
  const completed = item.progress.filter((entry) => entry.completed).length;
  const percent = lessons.length ? Math.round(completed / lessons.length * 100) : 0;
  const recentProgress = [...item.progress].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  const recentLesson = lessons.find((lesson) => lesson.id === recentProgress?.lesson_id);
  const nextLesson = recentLesson || lessons.find((lesson) => !item.progress.some((entry) => entry.lesson_id === lesson.id && entry.completed)) || lessons[0];
  const resources = item.course?.sections.flatMap((section) => section.lessons.flatMap((lesson) => lesson.resources.map((resource) => ({ ...resource, lessonTitle: lesson.title })))) || [];
  return { lessons, completed, percent, recentProgress, recentLesson, nextLesson, resources };
}

export default async function LearnPage({ searchParams }) {
  const [{ user, profile, enrolments, orders }, certificates, query] = await Promise.all([getStudentDashboard(), getStudentCertificates(), searchParams]);
  const states = enrolments.map((item) => ({ item, ...courseState(item) }));
  const lessonsDone = states.reduce((total, entry) => total + entry.completed, 0);
  const inProgress = states.filter((entry) => entry.lessons.length > 0 && entry.percent < 100).length;
  const firstName = String(profile?.full_name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0] || "there";
  const latest = states.filter((entry) => entry.recentLesson).sort((a, b) => new Date(b.recentProgress.updated_at) - new Date(a.recentProgress.updated_at))[0];
  const resources = states.flatMap((entry) => entry.resources.map((resource) => ({ ...resource, course: entry.item.course })));

  return <section className="learn-dashboard public-note">
    <div className="fm-learn-head">
      <div>
        <p className="eyebrow">MY LEARNING</p>
        <h1 className="page-title">Keep going, {firstName}.</h1>
      </div>
      <div className="fm-learn-actions"><Link className="button button-secondary" href="/courses">Browse more</Link><Link className="button button-secondary" href="/learn/certificates">My certificates</Link></div>
    </div>
    {query.message && <p className="success-note">{query.message}</p>}
    {query.error && <p className="form-error">{query.error}</p>}

    {latest ? <article className="fm-continue">
      <div className="fm-continue-cover">
        {latest.item.course.coverImageUrl ? <Image src={latest.item.course.coverImageUrl} alt={latest.item.course.title + " cover"} width={640} height={360} sizes="(max-width: 767px) 90vw, 220px" unoptimized /> : null}
      </div>
      <div className="fm-continue-body">
        <p className="fm-learn-label">CONTINUE LEARNING</p>
        <h2>{latest.item.course.title}</h2>
        <p className="fm-continue-lesson">{latest.recentLesson.title}</p>
        <div className="fm-bar" role="img" aria-label={latest.percent + " percent complete"}><span style={{ width: latest.percent + "%" }} /></div>
        <p className="fm-continue-meta">{latest.completed} of {latest.lessons.length} lessons complete</p>
        <Link className="button" href={latest.nextLesson ? "/learn/" + latest.item.course.slug + "/lesson/" + latest.nextLesson.id : "/learn/" + latest.item.course.slug}>{latest.percent === 100 ? "Review course" : "Resume"}</Link>
      </div>
    </article> : null}

    <div className="fm-stats">
      <div className="fm-stat"><small>Courses in progress</small><strong>{inProgress}</strong></div>
      <div className="fm-stat"><small>Lessons completed</small><strong>{lessonsDone}</strong></div>
      <div className="fm-stat"><small>Certificates earned</small><strong>{certificates.length}</strong></div>
    </div>

    {states.length ? <section className="fm-my-courses" id="courses">
      <div className="fm-section-head"><h2>My courses</h2></div>
      <div className="learning-grid">{states.map(({ item, percent, nextLesson }) => <article key={item.id}>
        {item.course.coverImageUrl ? <Image src={item.course.coverImageUrl} alt={item.course.title + " cover"} width={640} height={360} sizes="(max-width: 767px) 90vw, 180px" unoptimized /> : null}
        <div>
          <span className="fm-ring" style={{ background: "conic-gradient(#C6F000 " + (percent * 3.6) + "deg, #E9E9E1 0deg)" }} role="img" aria-label={percent + " percent complete"}><span>{percent}%</span></span>
          <h2>{item.course.title}</h2>
          <progress max="100" value={percent}>{percent}%</progress>
          <Link className="button" href={nextLesson ? "/learn/" + item.course.slug + "/lesson/" + nextLesson.id : "/learn/" + item.course.slug}>{percent === 100 ? "Review course" : "Continue"}</Link>
        </div>
      </article>)}</div>
    </section> : <EmptyState title="You haven't enrolled yet" action={<Link className="button" href="/courses">Browse courses</Link>}>When you enrol, your course appears here with its progress, the next lesson and the materials that come with it.</EmptyState>}

    <details className="student-profile"><summary>Profile</summary><form action={updateStudentProfile}><label>Name<input name="fullName" defaultValue={profile?.full_name || user?.user_metadata?.full_name || ""} required /></label><label>Email<input value={user?.email || ""} disabled /></label><button className="button">Save profile</button></form></details>

    {resources.length > 0 && <section className="student-downloads"><h2>Course materials</h2><div className="admin-list">{resources.map((resource) => <div key={resource.id}><span>{resource.title}<small>{resource.course.title} / {resource.lessonTitle}</small></span><span><a className="inline-link" href={"/api/learn/resources/" + resource.id} target="_blank" rel="noreferrer">View</a>{resource.allowDownload && <a className="inline-link" href={"/api/learn/resources/" + resource.id + "?download=1"}>Download</a>}</span></div>)}</div></section>}

    <section className="purchase-history" id="orders"><h2>Purchase history</h2>{orders.length ? <div className="admin-list">{orders.map((order) => <div key={order.id}><span>{order.courses?.title || order.reference}<small>{order.reference}</small></span><strong>{formatMoney(order.amount_minor, order.currency)} / {order.payment_status}</strong></div>)}</div> : <p>No purchases yet.</p>}</section>
  </section>;
}


