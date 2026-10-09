"use client";
import { useEffect, useRef, useState } from "react";

export default function StreamVideo({ src, onError, ...props }) {
  const ref = useRef(null);
  const errorRef = useRef(onError);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { errorRef.current = onError; }, [onError]);
  useEffect(() => {
    const controller = new AbortController();
    const video = ref.current;
    let hls;
    async function load() {
      try {
        const response = await fetch(src, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Video access could not be verified.");
        if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = data.url;
        else {
          const { default: Hls } = await import("hls.js");
          if (controller.signal.aborted) return;
          if (!Hls.isSupported()) throw new Error("This browser does not support streaming video.");
          hls = new Hls();
          hls.on(Hls.Events.ERROR, (_, detail) => {
            if (detail.fatal) { setError("Playback was interrupted. Retry to reconnect."); errorRef.current?.(); }
          });
          hls.loadSource(data.url);
          hls.attachMedia(video);
        }
      } catch (failure) {
        if (!controller.signal.aborted) { setError(failure.message); errorRef.current?.(); }
      }
    }
    load();
    return () => { controller.abort(); hls?.destroy(); video.removeAttribute("src"); video.load(); };
  }, [src, attempt]);
  return <><video {...props} ref={ref} onError={onError} />{error && <div role="alert" className="upload-error"><p>{error}</p><button type="button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Retry playback</button></div>}</>;
}
