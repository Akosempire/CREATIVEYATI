import HomePortfolio from "@/Components/home/HomePortfolio";
import { getPublicPortfolio } from "@/lib/data/public";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { demoVideos } from "@/lib/demo-data";
import { HOME } from "@/lib/content/home";
import { getYouTubeId } from "@/lib/youtube";

export const metadata = {
  title: { absolute: HOME.title },
  description: HOME.description,
  alternates: { canonical: "https://aivideocreator.cv/" },
  openGraph: { title: HOME.title, description: HOME.description, url: "https://aivideocreator.cv/" },
};

// the whole site front: fixed intro panel + a stream of work.
// services, about and contact live here now (their old pages redirect).

function ratioOf(video) {
  const stored = Number(video.aspectRatio);
  if (stored > 0) return stored;
  return video.orientation === "portrait" ? 9 / 16 : 16 / 9;
}

// youtube films get a muted looping preview in their frame; drive can't autoplay
function previewOf(video) {
  const id = video.youtubeVideoId
    || (video.videoProvider === "youtube" ? video.videoAssetId : "")
    || getYouTubeId(video.videoUrl || "") || getYouTubeId(video.youtubeUrl || "") || getYouTubeId(video.videoEmbedUrl || "");
  return id ? { kind: "youtube", id } : null;
}

function toProject(video) {
  const ratio = ratioOf(video);
  return {
    id: String(video.id),
    slug: video.slug || "",
    name: video.title || "Untitled",
    client: video.clientName || "",
    poster: video.posterUrl || "/img1.png",
    alt: video.coverAlt || `${video.title} still`,
    focal: `${Number(video.coverFocalX) || 50}% ${Number(video.coverFocalY) || 50}%`,
    ratio,
    orientation: ratio < 0.95 ? "portrait" : ratio > 1.05 ? "landscape" : "square",
    href: video.slug ? `/work/${video.slug}` : "/",
    preview: previewOf(video),
  };
}

export default async function Home() {
  const [{ videos }, site, socialLinks] = await Promise.all([getPublicPortfolio(), getSiteContent(), getPublicSocialLinks()]);
  // local previews without supabase still get a stream; production never shows demo work
  const usingDemo = !videos?.length && process.env.NODE_ENV !== "production";
  const projects = (videos?.length ? videos : usingDemo ? demoVideos : []).map(toProject);

  return <HomePortfolio
    projects={projects}
    site={{
      creatorName: site.creatorName,
      professionalTitle: site.professionalTitle,
      profileImage: site.profileImage || "/idayat-ibrahim.jpg",
      aboutCopy: site.aboutCopy,
      aboutCurrentWork: site.aboutCurrentWork,
      bookingUrl: site.bookingUrl || "",
      phone: site.phone || "",
      publicEmail: site.publicEmail || "",
    }}
    socialLinks={socialLinks.map(({ id, label, url, platform }) => ({ id, label, url, platform }))}
  />;
}
