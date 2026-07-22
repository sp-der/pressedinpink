"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";

const TOTAL_IMAGES = 34;

const villainWraps = Array.from({ length: TOTAL_IMAGES }, (_, index) => {
  const number = index + 1;

  return {
    number,
    image: `/wraps/villains/villians (${number}).png`,
    thumbnail: `/wraps/villains/thumbnails/villians (${number}).webp`,
  };
});

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function VillainsWrapsPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const closeViewer = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const showPrevious = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex === 0
        ? villainWraps.length - 1
        : currentIndex - 1;
    });
  }, []);

  const showNext = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex === villainWraps.length - 1
        ? 0
        : currentIndex + 1;
    });
  }, []);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, closeViewer, showPrevious, showNext]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX;

    if (touchEndX === undefined) {
      touchStartX.current = null;
      return;
    }

    const distance = touchEndX - touchStartX.current;

    if (distance > 60) {
      showPrevious();
    } else if (distance < -60) {
      showNext();
    }

    touchStartX.current = null;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none fixed inset-0
          bg-cover bg-no-repeat
          bg-[position:62%_top]
          sm:bg-[position:58%_top]
          md:bg-center
        "
        style={{
          backgroundImage: "url('/homepage-background.jpg')",
        }}
      />

      {/* Background tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/40"
      />

      <div className="relative z-10">
        {/* Header */}
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a
                href="/wraps"
                className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                style={smokyTextShadow}
              >
                ← Back to Wraps
              </a>
            </div>

            <a href="/" className="flex justify-center">
              <img
                src="/header-logo.png"
                alt="Pressed In Pink"
                className="h-auto max-h-24 w-44 object-contain sm:w-52 md:w-60"
              />
            </a>

            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <a
                href="https://www.instagram.com/pressed_in_pink/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border-2 border-red-600 px-5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-black"
              >
                Instagram
              </a>

              <a
                href="https://www.tiktok.com/@pressedinpink23?lang=en"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border-2 border-red-600 px-5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-black"
              >
                TikTok
              </a>
            </div>
          </div>
        </nav>

        {/* Heading */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/85 p-7 text-center shadow-2xl backdrop-blur-md sm:p-10">
            <p
              className="text-xs font-black uppercase tracking-[0.3em] text-white sm:text-sm"
              style={smokyTextShadow}
            >
              Pressed In Pink Collection
            </p>

            <h1
              className="mt-4 text-4xl font-black text-white sm:text-5xl md:text-6xl"
              style={smokyTextShadow}
            >
              Villains Wraps
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl leading-7 text-white"
              style={smokyTextShadow}
            >
              Click any design to see the full wrap. Use the arrows or swipe to
              browse through all 34 designs.
            </p>
          </div>
        </section>

        {/* Thumbnail gallery */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {villainWraps.map((wrap, index) => (
              <button
                key={wrap.image}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Open villains wrap ${wrap.number}`}
                className="group overflow-hidden rounded-3xl border border-red-900 bg-black shadow-xl transition duration-300 hover:-translate-y-1 hover:border-red-600 hover:shadow-2xl"
              >
                <div className="relative aspect-[2/1] w-full overflow-hidden">
                  <img
                    src={wrap.thumbnail}
                    alt={`Villains wrap design ${wrap.number}`}
                    loading={index < 6 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-red-900 bg-black/90 px-6 py-10 text-center backdrop-blur-md">
          <img
            src="/header-logo.png"
            alt="Pressed In Pink"
            className="mx-auto h-auto w-36 object-contain"
          />

          <p className="mt-4 text-white" style={smokyTextShadow}>
            Handmade with love in Rialto, California.
          </p>

          <a
            href="/wraps"
            className="mt-5 inline-block text-sm font-bold text-white transition hover:text-red-500"
            style={smokyTextShadow}
          >
            Return to Wraps
          </a>
        </footer>
      </div>

      {/* Full-screen image viewer */}
      {selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Villains wrap image viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
          onClick={closeViewer}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeViewer();
            }}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-3xl font-bold text-white shadow-xl transition hover:bg-red-600 sm:right-7 sm:top-7"
          >
            ×
          </button>

          {/* Previous button */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous villains wrap"
            className="absolute left-2 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold leading-none text-white shadow-xl transition hover:bg-red-600 sm:left-6 sm:h-14 sm:w-14"
          >
            ‹
          </button>

          {/* Full image preview */}
          <div
            className="w-full max-w-6xl rounded-3xl border border-red-900 bg-black/95 p-3 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-white">
              <img
                src={villainWraps[selectedIndex].image}
                alt={`Villains wrap design ${
                  villainWraps[selectedIndex].number
                }`}
                draggable={false}
                className="
                  absolute left-1/2 top-1/2
                  h-[200%] w-1/2 max-w-none
                  -translate-x-1/2 -translate-y-1/2
                  rotate-90 object-contain
                "
              />
            </div>

            <p
              className="pt-4 text-center text-sm font-bold text-white"
              style={smokyTextShadow}
            >
              {selectedIndex + 1} / {villainWraps.length}
            </p>
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next villains wrap"
            className="absolute right-2 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold leading-none text-white shadow-xl transition hover:bg-red-600 sm:right-6 sm:h-14 sm:w-14"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
