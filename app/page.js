import Link from "next/link";
import PublicHeader from "@/Components/PublicHeader";
import CourseCard from "@/Components/CourseCard";
import PublicFooter from "@/Components/PublicFooter";
import { getPublicPortfolio } from "@/lib/data/public";
import { getSiteContent } from "@/lib/data/site";
import { getCourseSettings } from "@/lib/data/settings";
import { getPublishedCourses } from "@/lib/data/courses";
import { getPublicSocialLinks } from "@/lib/data/social";

// The home page leads with the studio hero. The WebGL carousel is deliberately
// not mounted here; its engine is untouched and still available where it is used.
//
// Cards are sized by their own image rather than a fixed ratio, so nothing is
// ever cropped: equal width, equal gap, and only the vertical arc offsets differ.
const WASHES = [
  "linear-gradient(170deg, #cdc7bd 0%, #8f877c 100%)",
  "linear-gradient(170deg, #d7d2c8 0%, #a49c90 100%)",
  "linear-gradient(170deg, #c6c9c4 0%, #878d86 100%)",
  "linear-gradient(170deg, #d9d4cc 0%, #9c948a 100%)",
  "linear-gradient(170deg, #c9c4bb 0%, #8b8478 100%)",
  "linear-gradient(170deg, #d3cec5 0%, #9d968a 100%)",
  "linear-gradient(170deg, #c4bfb6 0%, #857f75 100%)",
];

// the schema has changed hands a few times, so accept whichever image field a
// project actually carries rather than assuming one
function stillFor(video) {
  return video?.posterUrl || video?.poster_url || video?.thumbnailUrl || video?.thumbnail_url || video?.imageUrl || video?.image_url || video?.src || video?.url || "";
}

export default async function Home() {
  const [{ videos, error }, site, courseSettings, socialLinks] = await Promise.all([getPublicPortfolio(), getSiteContent(), getCourseSettings(), getPublicSocialLinks()]);
  const courses = courseSettings.homepageEnabled ? await getPublishedCourses({ featured: true, limit: courseSettings.homepageLimit }) : [];

  const heading = site.heroHeading.split(site.highlightWord);
  const cards = (videos || []).slice(0, 7);
  const centre = (cards.length - 1) / 2;

  return <main className="portfolio-home">
    <section className="hero-work" style={{ "--site-accent": site.accentColor }}>
      <PublicHeader site={site} current="/" />

      <section className="lh-hero">
        <p className="lh-badge">Films, ads and product stories</p>
        <h1 className="lh-headline">
          {heading[0]}<span className="lh-strike">{site.highlightWord}</span>{heading.slice(1).join(site.highlightWord)}
        </h1>
        <p className="lh-lede">{site.heroCopy}</p>
        <div className="lh-actions">
          <Link className="lh-btn lh-btn-primary" href="/contact">{site.ctaLabel || "Start a project"}</Link>
          <Link className="lh-btn lh-btn-secondary" href="/work">See the work</Link>
        </div>
      </section>

      {error ? <p className="empty-state">{error}</p> : null}

      {cards.length ? <section className="lh-gallery" aria-label="Selected work">
        <div className="lh-fan">
          {cards.map((video, index) => {
            const distance = Math.abs(index - centre);
            const still = stillFor(video);
            return <figure
              className="lh-card"
              key={video.id || index}
              style={{ "--fan-i": index, "--fan-y": `${Math.round(distance * 22)}px` }}
            >
              {still
                ? <img src={still} alt={video.title || "Studio work"} loading={index > 2 ? "lazy" : "eager"} />
                : <span className="lh-card-wash" style={{ background: WASHES[index % WASHES.length] }} />}
            </figure>;
          })}
        </div>
      </section> : <p className="empty-state">No published work yet.</p>}
    </section>

    {courses.length > 0 && <section className="home-courses">
      <p className="eyebrow">LEARN</p><h2>{courseSettings.homepageHeading}</h2><p>{courseSettings.homepageCopy}</p>
      <div className="course-grid">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>
      <Link className="inline-link" href="/courses">View all courses</Link>
    </section>}

    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
