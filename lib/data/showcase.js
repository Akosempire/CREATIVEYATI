import "server-only";
import { getPublicPortfolio } from "@/lib/data/public";

// real published work for the places that used to show stock placeholders
// (services hero + cards, academy hero). admin service media still wins.

// what each service slot looks for in a project's category / tags / role / title
export const SHOWCASE_MATCH = {
  hero: /./,
  commercials: /commercial|brand|campaign|film|\bads?\b|tvc/i,
  products: /product|launch|advert|e-?commerce|packshot|unbox/i,
  social: /ugc|social|short|reel|tiktok|instagram|creator/i,
  editing: /edit|post|sound|colou?r|cut/i,
};

const playable = (v) => Boolean(v.videoEmbedUrl || v.videoUrl || v.youtubeUrl);

// keep only what the client needs: poster, link, and enough to embed the film
function toItem(v) {
  return {
    id: String(v.id),
    slug: v.slug,
    title: v.title,
    client: v.clientName || "",
    poster: v.posterUrl,
    alt: v.coverAlt || `${v.title} still`,
    focal: `${Number(v.coverFocalX) || 50}% ${Number(v.coverFocalY) || 50}%`,
    href: v.slug ? `/work/${v.slug}` : "/work",
    video: playable(v) ? {
      title: v.title,
      videoProvider: v.videoProvider, videoEmbedUrl: v.videoEmbedUrl, videoAssetId: v.videoAssetId,
      videoUrl: v.videoUrl, youtubeUrl: v.youtubeUrl, youtubeVideoId: v.youtubeVideoId,
      orientation: v.orientation, aspectRatio: v.aspectRatio,
    } : null,
    haystack: [v.category?.name, v.creativeRole, ...(v.tags || []), v.title, v.shortDescription].filter(Boolean).join(" "),
  };
}

export async function getShowcase() {
  try {
    const { videos } = await getPublicPortfolio();
    return (videos || []).filter((v) => v.posterUrl && !v.posterUrl.startsWith("/img")).map(toItem);
  } catch {
    return [];
  }
}

// one project per slot, best keyword match first, never the same project twice
export function assignShowcase(items, slots) {
  const used = new Set();
  const out = {};
  for (const slot of slots) {
    const rule = SHOWCASE_MATCH[slot] || /./;
    // fresh match, then any fresh project, then reuse rather than show a stock image
    const pick = items.find((it) => !used.has(it.id) && rule.test(it.haystack))
      || items.find((it) => !used.has(it.id))
      || items.find((it) => rule.test(it.haystack))
      || items[slots.indexOf(slot) % Math.max(items.length, 1)];
    if (pick) { used.add(pick.id); out[slot] = pick; }
  }
  return out;
}

// strip the matching text before it goes to the browser
export function clientItem(item) {
  if (!item) return null;
  const { haystack, ...rest } = item;
  return rest;
}
