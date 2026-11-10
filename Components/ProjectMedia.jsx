"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AdminIcon } from "./Icons";
import ExternalVideoPlayer from "./ExternalVideoPlayer";
import { projectAspectRatio, projectCovers, variantSrcSet } from "@/lib/project-media";
import { useVideoAspect } from "@/lib/video-aspect";

const contextSizes = {
  carousel: "(max-width: 720px) 92vw, 60vw",
  "project-page": "(max-width: 720px) 92vw, 800px",
  "focus-player": "(orientation: portrait) 88vw, 94vw",
  "admin-preview": "(max-width: 720px) 92vw, 520px",
};

export default function ProjectMedia({
  project,
  context = "carousel",
  priority = false,
  allowPlayback = false,
  autoPlay = false,
  preferMobile = false,
  onClose,
  className = "",
}) {
  // measured from the video itself; the admin orientation is only the starting guess
  const { ratio: videoAspectRatio, orientation } = useVideoAspect(project, projectAspectRatio(project));
  const covers = useMemo(() => projectCovers(project), [project]);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [overrideSource, setOverrideSource] = useState("");
  const hasMobileCover = Boolean(covers.mobileUrl || Object.keys(covers.mobileVariants).length);
  const mainSrcSet = variantSrcSet(preferMobile && hasMobileCover ? covers.mobileVariants : covers.mainVariants);
  const mobileSrcSet = variantSrcSet(covers.mobileVariants);
  const source = overrideSource || (preferMobile && covers.mobileUrl) || covers.mainUrl || covers.youtubeUrl || covers.fallbackUrl;
  const attemptedFallbacks = useRef(new Set());
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setTimeout(() => setPlaying(true), 100);
    return () => window.clearTimeout(timer);
  }, [autoPlay]);

  function useNextFallback(event) {
    const failed = event.currentTarget.getAttribute("src");
    const current = event.currentTarget.currentSrc || event.currentTarget.src;
    attemptedFallbacks.current.add(failed);
    attemptedFallbacks.current.add(current);
    const candidates = [preferMobile && covers.mobileUrl, covers.mainUrl, covers.youtubeUrl, covers.fallbackUrl, "/img1.png"].filter((value, index, values) => value && values.indexOf(value) === index);
    const next = candidates.find((candidate) => !attemptedFallbacks.current.has(candidate) && !attemptedFallbacks.current.has(new URL(candidate, window.location.href).href));
    setLoaded(!next);
    if (next) setOverrideSource(next);
  }

  // layout: when play swaps the 16:9 poster for the film's real shape, motion
  // eases the frame into its new size instead of snapping
  return <motion.div
    layout={!reduce}
    transition={{ layout: { duration: 0.55, ease } }}
    className={`project-media project-media--${context} ${className}`.trim()}
    data-video-orientation={orientation}
    data-ratio={playing ? (orientation === "portrait" ? "9:16" : orientation === "square" ? "1:1" : "16:9") : "16:9"}
    data-playing={playing ? "true" : "false"}
    style={{ "--media-aspect": playing ? videoAspectRatio : 16 / 9, "--cover-fit": "cover", "--focal-x": `${covers.focalX}%`, "--focal-y": `${covers.focalY}%` }}
  >
    <AnimatePresence mode="popLayout" initial={false}>
    {playing ? <motion.div key="player" className="project-media-layer" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.15 } }} exit={{ opacity: 0 }}>
      <ExternalVideoPlayer video={project} orientation={orientation} onClose={onClose} />
    </motion.div> : <motion.div key="poster" className="project-media-layer" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <picture>
        {preferMobile && !overrideSource && (covers.mobileUrl || mobileSrcSet) && <source srcSet={mobileSrcSet || covers.mobileUrl} sizes={contextSizes[context]} />}
        <motion.img
          key={source}
          initial={reduce ? false : { opacity: 0, scale: 1.02 }}
          animate={loaded || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease }}
          ref={(image) => { if (image?.complete && image.naturalWidth && !loaded) requestAnimationFrame(() => setLoaded(true)); }}
          src={source}
          srcSet={!overrideSource ? mainSrcSet || undefined : undefined}
          sizes={contextSizes[context]}
          alt={covers.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={useNextFallback}
          draggable="false"
        />
      </picture>
      {!loaded && <span className="project-media-loading" aria-hidden="true" />}
      {allowPlayback && <motion.button className="project-media-play" type="button" onClick={() => setPlaying(true)} style={{ x: "-50%" }} whileHover={reduce ? undefined : { y: -2 }} whileTap={{ scale: 0.96 }}><AdminIcon name="play" /> Play</motion.button>}
    </motion.div>}
    </AnimatePresence>
  </motion.div>;
}
