import "server-only";
import { getPublicPortfolio } from "@/lib/data/public";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";
import { demoVideos } from "@/lib/demo-data";
import { getYouTubeId } from "@/lib/youtube";

// everything the panel + stream pages (/, /services, /about) need, in one call

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

export async function getPortfolioPageData() {
  const [{ videos }, site, socialLinks] = await Promise.all([getPublicPortfolio(), getSiteContent(), getPublicSocialLinks()]);
  // local previews without supabase still get a stream; production never shows demo work
  const usingDemo = !videos?.length && process.env.NODE_ENV !== "production";
  const projects = (videos?.length ? videos : usingDemo ? demoVideos : []).map(toProject);
  return {
    projects,
    site: {
      creatorName: site.creatorName,
      professionalTitle: site.professionalTitle,
      profileImage: site.profileImage || "/idayat-ibrahim.jpg",
      profileFocal: `${Number(site.profileFocalX) || 50}% ${Number(site.profileFocalY) || 50}%`,
      aboutHeading: site.aboutHeading,
      aboutCopy: site.aboutCopy,
      aboutCurrentWork: site.aboutCurrentWork,
      aboutApproach: site.aboutApproach,
      aboutExperience: site.aboutExperience,
      aboutPhilosophy: site.aboutPhilosophy,
      availability: site.availability || "",
      bookingUrl: site.bookingUrl || "",
      phone: site.phone || "",
      publicEmail: site.publicEmail || "",
    },
    socialLinks: socialLinks.map(({ id, label, url, platform }) => ({ id, label, url, platform })),
  };
}
