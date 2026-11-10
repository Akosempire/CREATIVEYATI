"use client";

import { MotionConfig } from "motion/react";
import TopBar from "./site/TopBar";
import SiteMotion from "./site/SiteMotion";
import "./site/site-language.css";

// every page outside the homepage gets the same quiet top bar as the panel:
// avatar + name, a 2-line menu. the style layer comes along with it.
export default function PublicHeader({ site = {}, signedIn = false }) {
  return <MotionConfig reducedMotion="user">
    <TopBar
      className="tb-page sl-nav"
      signedIn={signedIn}
      site={{ creatorName: site.creatorName, profileImage: site.profileImage || "/idayat-ibrahim.jpg", bookingUrl: site.bookingUrl }}
    />
    <SiteMotion />
  </MotionConfig>;
}
