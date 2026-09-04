"use client";

import {
  useEffect,
  useRef,
} from "react";

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

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      void video.play().catch(() => undefined);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      {
        rootMargin: "300px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      controls={controls}
      className={className}
    />
  );
}
