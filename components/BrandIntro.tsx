"use client";

import { useEffect, useRef, useState } from "react";

export default function BrandIntro() {
  const logo = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const image = logo.current;
    const fallback = window.setTimeout(() => setDismissed(true), 8000);
    // Start only once the actual logo is decoded, including cached images.
    if (image) {
      image.decode().then(() => {
        window.clearTimeout(fallback);
        if (!cancelled) setReady(true);
      }).catch(() => {
        if (!cancelled) setDismissed(true);
      });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const fallback = window.setTimeout(() => setDismissed(true), 2200);
    return () => window.clearTimeout(fallback);
  }, [ready]);

  if (dismissed) return null;

  return (
    <>
      <div
        className="pnp-intro"
        data-ready={ready}
        aria-hidden="true"
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setDismissed(true);
        }}
      >
        <div className="pnp-intro-mark">
          <img
            ref={logo}
            src="/logo.png"
            alt=""
            width={1000}
            height={1000}
            loading="eager"
            fetchPriority="high"
            className="pnp-intro-logo"
            onError={() => setDismissed(true)}
          />
          <span className="pnp-intro-heart pnp-intro-heart-one">♥</span>
          <span className="pnp-intro-heart pnp-intro-heart-two">♥</span>
        </div>
      </div>
      <noscript><style>{".pnp-intro { display: none !important; }"}</style></noscript>
    </>
  );
}
