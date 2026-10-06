import Link from "next/link";
import PublicHeader from "@/Components/PublicHeader";
import CourseCard from "@/Components/CourseCard";
import PublicFooter from "@/Components/PublicFooter";
import { getPublicPortfolio } from "@/lib/data/public";
import { getSiteContent } from "@/lib/data/site";
import { getCourseSettings } from "@/lib/data/settings";
import { getPublishedCourses } from "@/lib/data/courses";
import { getPublicSocialLinks } from "@/lib/data/social";

export const metadata = {
  title: { absolute: "Idayat Ibrahim | AI Video Creator, Video Editor & AI Tutor in Nigeria" },
  description: "Idayat Ibrahim is an AI Video Creator, AI Video Editor, Visual Storyteller and AI Tutor based in Nigeria, creating AI commercials, product ads, UGC-style videos and branded content for clients worldwide.",
  alternates: { canonical: "https://aivideocreator.cv/" },
};

// The home page leads with the studio hero. The WebGL carousel is deliberately
// not mounted here; its engine is untouched and still available where it is used.
//
// The gallery drifts left continuously like the carousel did. The strip is
// rendered twice and the track translates by exactly half its width, so the loop
// is seamless. Cards take their height from the image, so nothing is cropped.
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
  // every published project drifts past, not a selection of them: upload more
  // and they join the loop without a code change
  const cards = videos || [];
  const centre = (cards.length - 1) / 2;

  function Card({ video, index, keyPrefix }) {
    const distance = Math.abs(index - centre);
    const still = stillFor(video);
    return <figure
      className="lh-card"
      key={`${keyPrefix}-${video.id || index}`}
      style={{ "--fan-i": index, "--fan-y": `${Math.round(distance * 22)}px` }}
    >
      {still
        ? <img src={still} alt={video.title || "Studio work"} loading="lazy" />
        : <span className="lh-card-wash" style={{ background: WASHES[index % WASHES.length] }} />}
    </figure>;
  }

  return <main className="portfolio-home">
    <section className="hero-work" style={{ "--site-accent": site.accentColor }}>
      <PublicHeader site={site} current="/" />

      <section className="lh-hero">
        <p className="lh-badge">AI VIDEO CREATOR · VIDEO EDITOR · AI TUTOR</p>
        <h1 className="lh-headline">
          {heading[0]}<span className="lh-strike">{site.highlightWord}</span>{heading.slice(1).join(site.highlightWord)}
        </h1>
        <p className="lh-lede">Idayat Ibrahim is an AI video creator and editor based in Nigeria, creating AI commercials, product films, UGC-style content and branded campaigns for clients worldwide.</p>
        <div className="lh-actions">
          <Link className="lh-btn lh-btn-primary" href="/contact">{site.ctaLabel || "Start a project"}</Link>
          <Link className="lh-btn lh-btn-secondary" href="/work">See the work</Link>
        </div>
      </section>

      {error ? <p className="empty-state">{error}</p> : null}

      {cards.length ? <section className="lh-gallery" aria-label="Selected work">
        {/* duration scales with the count so the drift speed stays the same as
            the catalogue grows, rather than accelerating */}
        <div className="lh-marquee" style={{ "--marquee-duration": `${Math.max(30, cards.length * 6)}s` }}>
          <div className="lh-strip">
            {cards.map((video, index) => <Card keyPrefix="a" video={video} index={index} key={`a-${video.id || index}`} />)}
          </div>
          {/* the second copy is what makes the loop seamless; hidden from readers */}
          <div className="lh-strip" aria-hidden="true">
            {cards.map((video, index) => <Card keyPrefix="b" video={video} index={index} key={`b-${video.id || index}`} />)}
          </div>
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
