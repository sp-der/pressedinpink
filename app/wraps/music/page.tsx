"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const R2_WRAP_BASE_URL = "https://images.pressedinpink.com/wraps";
const TOTAL_IMAGES = 75;
const WRAPS_PER_PAGE = 24;

const wraps = Array.from({ length: TOTAL_IMAGES }, (_, index) => {
  const number = index + 1;
  const filename = `Music (${number})`;

  return {
    number,
    src: `${R2_WRAP_BASE_URL}/music/originals/${filename}.png`,
    thumbnailSrc:
      `${R2_WRAP_BASE_URL}/music/thumbnails/${filename}.webp`,
  };
});

const TOTAL_PAGES = Math.ceil(wraps.length / WRAPS_PER_PAGE);

type PaginationItem =
  | number
  | "ellipsis-left"
  | "ellipsis-right";

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis-right",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
}

export default function MusicWrapsPage() {
  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const galleryRef = useRef<HTMLElement | null>(null);
  const pageStartIndex =
    (currentPage - 1) * WRAPS_PER_PAGE;
  const pageEndIndex = Math.min(
    pageStartIndex + WRAPS_PER_PAGE,
    wraps.length,
  );

  const visibleWraps = wraps.slice(
    pageStartIndex,
    pageEndIndex,
  );

  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, TOTAL_PAGES),
    [currentPage],
  );

  const closeViewer = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const showPrevious = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex === 0
        ? wraps.length - 1
        : currentIndex - 1;
    });
  }, []);

  const showNext = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex === wraps.length - 1
        ? 0
        : currentIndex + 1;
    });
  }, []);

  const goToPage = useCallback((pageNumber: number) => {
    const safePage = Math.min(
      Math.max(pageNumber, 1),
      TOTAL_PAGES,
    );

    setCurrentPage(safePage);

    window.requestAnimationFrame(() => {
      galleryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

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
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    selectedIndex,
    closeViewer,
    showPrevious,
    showNext,
  ]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousIndex =
      selectedIndex === 0
        ? wraps.length - 1
        : selectedIndex - 1;

    const nextIndex =
      selectedIndex === wraps.length - 1
        ? 0
        : selectedIndex + 1;

    const previousImage = new Image();
    previousImage.src = wraps[previousIndex].src;

    const nextImage = new Image();
    nextImage.src = wraps[nextIndex].src;
  }, [selectedIndex]);

  const renderPagination = (
    location: "top" | "bottom",
  ) => {
    if (TOTAL_PAGES <= 1) {
      return null;
    }

    return (
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        aria-label={`Music wrap gallery ${location} pages`}
      >
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            rounded-full border border-red-600 bg-black/90
            px-4 py-2 text-sm font-bold text-white transition
            hover:bg-red-600
            disabled:cursor-not-allowed
            disabled:border-white/20
            disabled:text-white/30
            disabled:hover:bg-black/90
          "
        >
          ← Previous
        </button>

        {paginationItems.map((item) => {
          if (typeof item !== "number") {
            return (
              <span
                key={item}
                aria-hidden="true"
                className="px-1 text-sm font-black text-white/70"
              >
                …
              </span>
            );
          }

          const isActive = item === currentPage;

          return (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              aria-current={
                isActive ? "page" : undefined
              }
              aria-label={`Go to gallery page ${item}`}
              className={`
                flex h-10 w-10 items-center justify-center
                rounded-full border text-sm font-black transition
                ${
                  isActive
                    ? "border-red-600 bg-red-600 text-white shadow-lg"
                    : "border-red-900 bg-black/90 text-white hover:border-red-600 hover:bg-red-600"
                }
              `}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === TOTAL_PAGES}
          className="
            rounded-full border border-red-600 bg-black/90
            px-4 py-2 text-sm font-bold text-white transition
            hover:bg-red-600
            disabled:cursor-not-allowed
            disabled:border-white/20
            disabled:text-white/30
            disabled:hover:bg-black/90
          "
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
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
          backgroundImage:
            "url('/homepage-background.jpg')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/40"
      />

      <div className="relative z-10">
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
              Music Wraps
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl leading-7 text-white"
              style={smokyTextShadow}
            >
              Click any design to see the full wrap. Use the
              gallery pages to browse faster, or use the viewer
              arrows to move through all 75 designs continuously.
            </p>
          </div>
        </section>

        <section
          ref={galleryRef}
          className="scroll-mt-6 mx-auto max-w-7xl px-4 pb-20 sm:px-6"
        >
          <div className="mb-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-red-900/80 bg-black/80 px-5 py-4 backdrop-blur-md sm:flex-row">
            <div className="text-center sm:text-left">
              <p
                className="text-sm font-bold text-white"
                style={smokyTextShadow}
              >
                Showing wraps {pageStartIndex + 1}–
                {pageEndIndex} of {wraps.length}
              </p>

              <p
                className="mt-1 text-xs text-white/80"
                style={smokyTextShadow}
              >
                Gallery page {currentPage} of {TOTAL_PAGES}
              </p>
            </div>

            {renderPagination("top")}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleWraps.map((wrap, localIndex) => {
              const globalIndex =
                pageStartIndex + localIndex;

              return (
                <button
                  key={wrap.src}
                  type="button"
                  onClick={() =>
                    setSelectedIndex(globalIndex)
                  }
                  aria-label={`Open music wrap ${wrap.number}`}
                  className="group overflow-hidden rounded-3xl border border-red-900 bg-black shadow-xl transition duration-300 hover:-translate-y-1 hover:border-red-600 hover:shadow-2xl"
                >
                  <div className="relative aspect-[2/1] w-full overflow-hidden">
                    <img
                      src={wrap.thumbnailSrc}
                      alt={`Music wrap design ${wrap.number}`}
                      loading={
                        localIndex < 3
                          ? "eager"
                          : "lazy"
                      }
                      decoding="async"
                      draggable={false}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = wrap.src;
                      }}
                      className="
                        absolute left-1/2 top-1/2
                        h-[204%] w-[52%] max-w-none
                        -translate-x-1/2 -translate-y-1/2
                        rotate-90 object-cover
                        transition duration-300
                        group-hover:scale-[1.03]
                      "
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {TOTAL_PAGES > 1 && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <p
                className="text-sm font-bold text-white"
                style={smokyTextShadow}
              >
                Page {currentPage} of {TOTAL_PAGES}
              </p>

              {renderPagination("bottom")}
            </div>
          )}
        </section>

        <footer className="border-t border-red-900 bg-black/90 px-6 py-10 text-center backdrop-blur-md">
          <img
            src="/header-logo.png"
            alt="Pressed In Pink"
            className="mx-auto h-auto w-36 object-contain"
          />

          <p
            className="mt-4 text-white"
            style={smokyTextShadow}
          >
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

      {selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Music wrap image viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
          onClick={closeViewer}
        >
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

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous music wrap"
            className="absolute left-2 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold leading-none text-white shadow-xl transition hover:bg-red-600 sm:left-6 sm:h-14 sm:w-14"
          >
            ‹
          </button>

          <div
            className="w-full max-w-6xl rounded-3xl border border-red-900 bg-black/95 p-3 shadow-2xl sm:p-5"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-white">
              <img
                src={wraps[selectedIndex].src}
                alt={`Music wrap design ${wraps[selectedIndex].number}`}
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
              {selectedIndex + 1} / {wraps.length}
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next music wrap"
            className="absolute right-2 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold leading-none text-white shadow-xl transition hover:bg-red-600 sm:right-6 sm:h-14 sm:w-14"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
