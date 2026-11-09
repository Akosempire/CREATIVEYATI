import GridHome from "@/Components/grid/GridHome";
import { getPublicPortfolio } from "@/lib/data/public";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { demoVideos } from "@/lib/demo-data";

export const metadata = {
  title: { absolute: "Idayat Ibrahim | AI Video Creator, Video Editor & AI Tutor in Nigeria" },
  description: "Idayat Ibrahim is an AI Video Creator, AI Video Editor, Visual Storyteller and AI Tutor based in Nigeria, creating AI commercials, product ads, UGC-style videos and branded content for clients worldwide.",
  alternates: { canonical: "https://aivideocreator.cv/" },
};

// the home page is the whole portfolio: an infinite curved grid of work (webgl)
// with about + contact in a sheet on top. inner routes (/work/[slug], academy,
// courses) stay as they were.

const unique = (list) => [...new Set(list.filter(Boolean))];

// one record per project, in the shape the grid engine expects
function toGridProject(video) {
  // a cover usually comes in a few cuts; each distinct still becomes crops in the cluster
  const stills = unique([
    video.posterUrl,
    video.mobileCoverImageUrl || video.mobilePosterUrl,
    video.videoThumbnailUrl || video.youtubeThumbnailUrl,
  ]);
  const images = Array.from({ length: 6 }, (_, i) => stills[i % Math.max(stills.length, 1)] || "/img1.png");
  const services = unique([video.category?.name, video.creativeRole, ...(video.tags || [])]).slice(0, 5);
  return {
    id: String(video.id),
    slug: video.slug || "",
    name: video.title || "Untitled",
    client: video.clientName || "",
    year: video.year || null,
    brandColor: video.brandColor || null,
    services: services.length ? services : ["AI video"],
    blurb: video.shortDescription || video.description || "",
    images,
    caseStudyUrl: video.slug ? `/work/${video.slug}` : "/work",
  };
}

function nextQuarter(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3) + 2;
  return q > 4 ? `Q1 ${date.getFullYear() + 1}` : `Q${q} ${date.getFullYear()}`;
}

export default async function Home() {
  const [{ videos, error }, site, socialLinks] = await Promise.all([getPublicPortfolio(), getSiteContent(), getPublicSocialLinks()]);

  // local previews without supabase still get a grid; production never shows demo work
  const usingDemo = !videos?.length && process.env.NODE_ENV !== "production";
  const source = videos?.length ? videos : usingDemo ? demoVideos : [];
  const projects = source.map(toGridProject);

  // ticker is real content only: what's booking + the latest published work
  const ticker = [
    `Now booking projects for ${nextQuarter()}`,
    ...projects.slice(0, 8).map((p) => (p.client ? `${p.client}: ${p.name}` : p.name)),
    site.availability || "Nigeria · Available worldwide",
    "AI commercials · Product films · UGC · Campaigns",
  ];

  const about = {
    creatorName: site.creatorName,
    professionalTitle: site.professionalTitle,
    profileImage: site.profileImage || "/idayat-ibrahim.jpg",
    profileFocal: `${Number(site.profileFocalX) || 50}% ${Number(site.profileFocalY) || 50}%`,
    paragraphs: [site.aboutCopy, site.aboutCurrentWork].filter(Boolean),
    email: site.publicEmail || "",
    phone: site.phone || "",
    bookingUrl: site.bookingUrl || "",
    availability: site.availability || "",
  };

  return <GridHome
    projects={projects}
    ticker={ticker}
    about={about}
    socialLinks={socialLinks.map(({ id, label, url, platform }) => ({ id, label, url, platform }))}
    accent={site.accentColor || "#a3c900"}
    notice={!projects.length ? (error || "No published work yet.") : usingDemo ? "Demo projects · Supabase not connected" : ""}
  />;
}
