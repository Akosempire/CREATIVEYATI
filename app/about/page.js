import Link from "next/link";
import ProfileAvatar from "@/Components/ProfileAvatar";
import PublicHeader from "@/Components/PublicHeader";
import PublicTextReveal from "@/Components/PublicTextReveal";
import PublicFooter from "@/Components/PublicFooter";
import SocialLinks from "@/Components/SocialLinks";
import { getSiteContent } from "@/lib/data/site";
import { getPublicSocialLinks } from "@/lib/data/social";

export const metadata = { title: { absolute: "About Idayat Ibrahim | AI Video Creator & Visual Storyteller" }, description: "Meet Idayat Ibrahim, an AI Video Creator, AI Video Editor, Visual Storyteller and AI Tutor based in Nigeria, working with brands and creators worldwide.", alternates: { canonical: "https://aivideocreator.cv/about" } };

export default async function AboutPage() {
  const [site, socialLinks] = await Promise.all([getSiteContent(), getPublicSocialLinks()]);
  const initials = String(site.creatorName || "Portfolio").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const focal = `${Number(site.profileFocalX) || 50}% ${Number(site.profileFocalY) || 50}%`;
  return <main className="about-page public-page">
    <PublicHeader site={site} current="/about" />
    <PublicTextReveal as="article" className="about-note public-note">
      <div className="about-identity"><ProfileAvatar className="about-avatar" src={site.profileImage} width={52} height={52} sizes="52px" style={{ objectPosition: focal }} alt={`${site.creatorName} profile`} initials={initials} /><div><h1 data-reveal>{site.creatorName}</h1><p data-reveal>{site.professionalTitle}</p>{site.availability && <small data-reveal>{site.availability}</small>}</div></div>
      <div className="about-copy"><p data-reveal>Idayat Ibrahim is an AI Video Creator, AI Video Editor, Visual Storyteller and AI Video Tutor based in Nigeria. She creates AI-powered commercials, product videos, UGC-style content, branded films and social media campaigns for businesses, brands and creators in Nigeria and internationally.</p><p data-reveal>Alongside her production work, Idayat teaches AI video creation through <Link href="/academy">AI VIDEO CREATOR Academy</Link>, helping creators learn AI image generation, AI video generation, visual storytelling, prompting, editing, sound design and commercial video production.</p><p data-reveal>{site.aboutApproach}</p><p data-reveal>{site.aboutPhilosophy}</p></div>
      <p className="about-links" data-reveal>Available for commercial films, branded content, social campaigns and creative collaborations. <Link href="/work">View selected work</Link> or <Link href="/contact">start a project enquiry</Link>.</p>
      <SocialLinks links={socialLinks} />
    </PublicTextReveal>
    <PublicFooter site={site} socialLinks={socialLinks} />
  </main>;
}
