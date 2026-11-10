// top-of-page content on public pages that opens with the homepage intro motion
// (rise + unblur, staggered). shared by the pre-paint gate in app/layout.js and
// SiteMotion, which plays it. elements with [data-reveal] get the line reveal instead.
export const ENTER = ":is(.avc-hero > :is(.avc-kicker, h1, .avc-intro, .avc-actions), .avc-hero-stage, .catalog-intro > *, .catalog-spotlight, .course-overview :is(.overview-crumb, .course-banner, .course-head > *), .project-page > :is(.inline-link, .public-lede), .project-page .project-media, .checkout-introduction > *, .about-note > :is(.eyebrow, .page-title, .about-copy, .contact-form), .fm-auth-aside > *, .fm-auth-card, .public-note > :is(h1, p, form)):not([data-reveal])";

// hides ENTER until motion takes over: set before first paint, skipped under
// reduced motion, cleared after 2s no matter what so nothing can stay hidden.
// scoped to pages with the public nav, so admin screens are never affected.
export const ENTER_GATE_SCRIPT = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var r=document.documentElement;r.setAttribute("data-sl-enter","");setTimeout(function(){r.removeAttribute("data-sl-enter")},2000)}catch(e){}})();`;
export const ENTER_GATE_CSS = `html[data-sl-enter] body:has(.sl-nav) ${ENTER}{opacity:0}`;
