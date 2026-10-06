import PublicHeader from "@/Components/PublicHeader";
import PublicTextReveal from "@/Components/PublicTextReveal";
import PublicFooter from "@/Components/PublicFooter";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";

export const metadata = { title: { absolute: "AI Video Creation & Video Editing Services | Idayat Ibrahim" }, description: "AI video creation, video editing, UGC-style content, product advertisements and commercial storytelling for brands in Nigeria and worldwide.", alternates: { canonical: "https://aivideocreator.cv/services" } };

export default async function ServicesPage() {
  const [site, socialLinks] = await Promise.all([getSiteContent(), getPublicSocialLinks()]);
  return <main className="public-page"><PublicHeader site={site} current="/services" /><PublicTextReveal as="article" className="about-note public-note"><p className="eyebrow" data-reveal>AI VIDEO CREATION & EDITING</p><h1 className="page-title" data-reveal>From a clear idea to a considered final cut.</h1><div className="about-copy"><p data-reveal>Idayat Ibrahim creates AI-powered commercials, product advertisements, UGC-style videos and branded content for businesses in Nigeria and worldwide.</p><p data-reveal>Services span creative direction, concept development, AI image and video generation, video editing and sound design. Every project begins with the message, the audience and the story the work needs to tell.</p><p data-reveal>For creators who want to build these skills, AI VIDEO CREATOR Academy offers practical training in AI-assisted video production.</p></div></PublicTextReveal><PublicFooter site={site} socialLinks={socialLinks} /></main>;
}
