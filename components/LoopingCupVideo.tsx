"use client";
import { useEffect, useRef, useState } from "react";

type LoopingCupVideoProps = {
  src: string;
  className?: string;
  controls?: boolean;
};
export default function LoopingCupVideo({
  src,
  className = "h-full w-full object-cover",
  controls = false,
}: LoopingCupVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches || !visible) video.pause();
      else void video.play().catch(() => undefined);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        // Attach the source only near the viewport, avoiding metadata requests for
        // every cup in the catalog. Keep the same original R2 video.
        if (visible && video.getAttribute("src") !== src) video.src = src;
        update();
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    update();
    observer.observe(video);
    preference.addEventListener("change", update);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", update);
      video.pause();
    };
  }, [src]);
  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="metadata"
      controls={controls || reducedMotion}
      className={className}
    />
  );
}
