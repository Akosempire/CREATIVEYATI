"use client";

import { useEffect, useState } from "react";
import { getYouTubeId } from "./youtube";
import { getGoogleDriveId } from "./video-source";

// work out a video's real shape so the player never forces 16:9 onto a 9:16
// clip (or the other way round). the admin orientation is only the fallback.
//
// - uploaded files: read videoWidth / videoHeight from the <video> itself
// - google drive: the drive thumbnail keeps the video's proportions
// - youtube: hqdefault.jpg is a 4:3 frame with black bars around the real
//   picture, so measure the non-black box. /shorts/ links are 9:16 by default.

const COMMON = [16 / 9, 9 / 16, 1, 4 / 5, 4 / 3, 3 / 4, 21 / 9, 2 / 3, 3 / 2];
const cache = new Map();

// snap near-misses to a standard ratio, keep genuinely odd ones as measured
export function snapRatio(ratio) {
  if (!(ratio > 0)) return null;
  const best = COMMON.reduce((a, b) => (Math.abs(Math.log(b / ratio)) < Math.abs(Math.log(a / ratio)) ? b : a));
  return Math.abs(Math.log(best / ratio)) < 0.06 ? best : ratio;
}

export function orientationFor(ratio) {
  if (!(ratio > 0)) return "landscape";
  return ratio < 0.95 ? "portrait" : ratio > 1.05 ? "landscape" : "square";
}

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// bounding box of the picture inside a letterboxed/pillarboxed thumbnail
function contentRatio(img) {
  const w = 160, h = 120;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const lit = (x, y) => {
    const i = (y * w + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114 > 22;
  };
  const colHas = (x) => { let n = 0; for (let y = 0; y < h; y++) if (lit(x, y)) n++; return n > h * 0.06; };
  const rowHas = (y) => { let n = 0; for (let x = 0; x < w; x++) if (lit(x, y)) n++; return n > w * 0.06; };
  let left = 0, right = w - 1, top = 0, bottom = h - 1;
  while (left < right && !colHas(left)) left++;
  while (right > left && !colHas(right)) right--;
  while (top < bottom && !rowHas(top)) top++;
  while (bottom > top && !rowHas(bottom)) bottom--;
  const bw = right - left + 1;
  const bh = bottom - top + 1;
  // no bars at all means the thumbnail was cropped to 4:3: we can't tell
  if (bw > w * 0.96 && bh > h * 0.96) return null;
  // a nearly-black frame isn't evidence of anything
  if (bw < w * 0.2 || bh < h * 0.2) return null;
  // undo the 160x120 squeeze of the 480x360 source (both 4:3, so 1:1)
  return bw / bh;
}

async function measureYouTube(id) {
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  // through next's image route so it's same-origin and the pixels are readable
  const img = await loadImage(`/_next/image?url=${encodeURIComponent(thumb)}&w=640&q=75`);
  return contentRatio(img);
}

async function measureDrive(id) {
  const img = await loadImage(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w400`);
  return img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null;
}

function sourceOf(media) {
  const url = media?.videoUrl || media?.youtubeUrl || media?.sourceUrl || media?.embedUrl || media?.videoEmbedUrl || "";
  const provider = media?.videoProvider || media?.sourceType || "";
  const youtubeId = media?.youtubeVideoId || (provider === "youtube" ? media?.videoAssetId || media?.sourceId : "") || getYouTubeId(url) || getYouTubeId(media?.videoEmbedUrl || media?.embedUrl || "");
  if (youtubeId) return { kind: "youtube", id: youtubeId, short: /\/shorts\//.test(url) };
  const driveId = (provider === "google_drive" ? media?.videoAssetId || media?.sourceId : "") || getGoogleDriveId(url) || getGoogleDriveId(media?.videoEmbedUrl || media?.embedUrl || "");
  if (driveId) return { kind: "drive", id: driveId };
  return null;
}

export async function detectVideoAspect(media) {
  const source = sourceOf(media);
  if (!source) return null;
  const key = `${source.kind}:${source.id}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      try {
        const measured = source.kind === "youtube" ? await measureYouTube(source.id) : await measureDrive(source.id);
        const snapped = snapRatio(measured);
        // a youtube box that isn't a standard shape is probably dark footage, not bars
        if (snapped && (source.kind === "drive" || COMMON.includes(snapped))) return snapped;
      } catch {
        // fall through to hints
      }
      return source.short ? 9 / 16 : null;
    })());
  }
  return cache.get(key);
}

// stored ratio first (no layout jump on render), then the measured one
export function useVideoAspect(media, storedRatio) {
  const fallback = Number(storedRatio) > 0 ? Number(storedRatio) : 16 / 9;
  const [measured, setMeasured] = useState(null);
  useEffect(() => {
    let live = true;
    detectVideoAspect(media).then((ratio) => { if (live && ratio) setMeasured(ratio); });
    return () => { live = false; };
  }, [media]);
  const ratio = measured || fallback;
  return { ratio, orientation: orientationFor(ratio), measured: Boolean(measured), setMeasured };
}
