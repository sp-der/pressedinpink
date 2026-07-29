
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AddToCartControls from "@/components/AddToCartControls";
import { supabase } from "@/lib/supabase";
import type { CatalogWrapRecord } from "@/types/catalog";
import type { WrapProduct } from "@/types/cart";
import type { WrapCategoryConfig } from "@/types/wraps";

const R2_WRAP_BASE_URL =
  "https://images.pressedinpink.com/wraps";

const WRAPS_PER_PAGE = 24;

type WrapGalleryProps = {
  category: WrapCategoryConfig;
};

type GalleryWrap = {
  number: number;
  product: WrapProduct;
};

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

function createBaseWraps(
  category: WrapCategoryConfig,
): GalleryWrap[] {
  return Array.from(
    { length: category.totalImages },
    (_, index) => {
      const number = index + 1;
      const filenameWithoutExtension =
        `${category.filenamePrefix} (${number})`;

      const sourceFilename =
        `${filenameWithoutExtension}.png`;

      const fullImageUrl =
        `${R2_WRAP_BASE_URL}/${category.imageFolder}/originals/${sourceFilename}`;

      const thumbnailUrl =
        `${R2_WRAP_BASE_URL}/${category.imageFolder}/thumbnails/${filenameWithoutExtension}.webp`;

      return {
        number,
        product: {
          id: `${category.slug}-${number}`,
          displayName:
            `${category.itemLabel} ${number}`,
          categorySlug: category.slug,
          categoryName:
            category.displayName,
          imageNumber: number,
          sourceFilename,
          thumbnailUrl,
          fullImageUrl,
        },
      };
    },
  );
}

export default function WrapGallery({
  category,
}: WrapGalleryProps) {
  const baseWraps = useMemo(
    () => createBaseWraps(category),
    [category],
  );
  const [uploadedWraps, setUploadedWraps] =
    useState<CatalogWrapRecord[]>([]);
  const [loadingCatalog, setLoadingCatalog] =
    useState(true);
  const [catalogMessage, setCatalogMessage] =
    useState("");
  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);
  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    let active = true;

    const loadUploadedWraps = async () => {
      setLoadingCatalog(true);
      setCatalogMessage("");

      const { data: catalogCategory, error: categoryError } =
        await supabase
          .from("catalog_categories")
          .select("id")
          .eq("slug", category.slug)
          .maybeSingle();

      if (!active) {
        return;
      }

      if (categoryError) {
        setCatalogMessage(
          category.totalImages === 0
            ? "The live catalog is not configured yet."
            : "Dashboard uploads could not be checked.",
        );
        setUploadedWraps([]);
        setLoadingCatalog(false);
        return;
      }

      if (!catalogCategory?.id) {
        setUploadedWraps([]);
        setLoadingCatalog(false);
        return;
      }

      const { data, error } = await supabase
        .from("catalog_wraps")
        .select("*")
        .eq("category_id", catalogCategory.id)
        .eq("is_active", true)
        .order("image_number", { ascending: true });

      if (!active) {
        return;
      }

      if (error) {
        setCatalogMessage(
          category.totalImages === 0
            ? "The uploaded wraps could not be loaded."
            : "Dashboard uploads could not be loaded.",
        );
        setUploadedWraps([]);
      } else {
        setUploadedWraps(
          (data ?? []) as CatalogWrapRecord[],
        );
      }

      setLoadingCatalog(false);
    };

    void loadUploadedWraps();

    return () => {
      active = false;
    };
  }, [category.slug, category.totalImages]);

  const wraps = useMemo(() => {
    const merged = new Map<number, GalleryWrap>();

    for (const wrap of baseWraps) {
      merged.set(wrap.number, wrap);
    }

    for (const wrap of uploadedWraps) {
      merged.set(wrap.image_number, {
        number: wrap.image_number,
        product: {
          id: `${category.slug}-${wrap.image_number}`,
          displayName: wrap.display_name,
          categorySlug: category.slug,
          categoryName: category.displayName,
          imageNumber: wrap.image_number,
          sourceFilename: wrap.source_filename,
          thumbnailUrl: wrap.thumbnail_url,
          fullImageUrl: wrap.full_image_url,
        },
      });
    }

    return Array.from(merged.values()).sort(
      (first, second) => first.number - second.number,
    );
  }, [baseWraps, uploadedWraps, category]);

  const totalPages = Math.max(
    1,
    Math.ceil(wraps.length / WRAPS_PER_PAGE),
  );

  const galleryRef =
    useRef<HTMLElement | null>(null);

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
    () =>
      getPaginationItems(
        currentPage,
        totalPages,
      ),
    [currentPage, totalPages],
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
  }, [wraps.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex ===
        wraps.length - 1
        ? 0
        : currentIndex + 1;
    });
  }, [wraps.length]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      const safePage = Math.min(
        Math.max(pageNumber, 1),
        totalPages,
      );

      setCurrentPage(safePage);

      window.requestAnimationFrame(() => {
        galleryRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [totalPages],
  );

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIndex(null);
  }, [category.slug]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
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

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

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
    previousImage.src =
      wraps[
        previousIndex
      ].product.fullImageUrl;

    const nextImage = new Image();
    nextImage.src =
      wraps[nextIndex].product.fullImageUrl;
  }, [selectedIndex, wraps]);

  const renderPagination = (
    location: "top" | "bottom",
  ) => {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        aria-label={`${category.displayName} wrap gallery ${location} pages`}
      >
        <button
          type="button"
          onClick={() =>
            goToPage(currentPage - 1)
          }
          disabled={currentPage === 1}
          className="
            rounded-full border border-red-600
            bg-black/90 px-4 py-2
            text-sm font-bold text-white
            transition hover:bg-red-600
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

          const isActive =
            item === currentPage;

          return (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              aria-label={`Go to gallery page ${item}`}
              className={`
                flex h-10 w-10 items-center
                justify-center rounded-full
                border text-sm font-black
                transition
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
          onClick={() =>
            goToPage(currentPage + 1)
          }
          disabled={
            currentPage === totalPages
          }
          className="
            rounded-full border border-red-600
            bg-black/90 px-4 py-2
            text-sm font-bold text-white
            transition hover:bg-red-600
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

  const selectedWrap =
    selectedIndex === null
      ? null
      : wraps[selectedIndex];

  const designWord =
    wraps.length === 1
      ? "design"
      : "designs";

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
                href={category.backHref}
                className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                style={smokyTextShadow}
              >
                ← {category.backLabel}
              </a>
            </div>

            <a
              href="/"
              className="flex justify-center"
            >
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
              {category.heading}
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl leading-7 text-white"
              style={smokyTextShadow}
            >
              Click any design to see the
              full wrap, then select a
              quantity and add it to your
              request cart. Browse all{" "}
              {wraps.length} {designWord}{" "}
              continuously with the viewer
              arrows.
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
                Showing wraps{" "}
                {wraps.length === 0
                  ? 0
                  : pageStartIndex + 1}
                –{pageEndIndex} of {wraps.length}
              </p>

              <p
                className="mt-1 text-xs text-white/80"
                style={smokyTextShadow}
              >
                Gallery page {currentPage}{" "}
                of {totalPages}
              </p>
            </div>

            {renderPagination("top")}
          </div>

          {wraps.length === 0 ? (
            <div className="rounded-3xl border border-red-900 bg-black/90 px-6 py-12 text-center shadow-xl backdrop-blur-md">
              <h2 className="text-2xl font-black text-white">
                {loadingCatalog
                  ? "Loading published wraps…"
                  : "No wraps published yet"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">
                {loadingCatalog
                  ? "Checking the live PNP catalog."
                  : catalogMessage ||
                    "PNP can publish the first designs from the admin catalog uploader."}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleWraps.map(
              (wrap, localIndex) => {
                const globalIndex =
                  pageStartIndex +
                  localIndex;

                return (
                  <article
                    key={wrap.product.id}
                    className="
                      overflow-hidden rounded-3xl
                      border border-red-900
                      bg-black shadow-xl
                      transition duration-300
                      hover:-translate-y-1
                      hover:border-red-600
                      hover:shadow-2xl
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIndex(
                          globalIndex,
                        )
                      }
                      aria-label={`Open ${wrap.product.displayName}`}
                      className="group block w-full"
                    >
                      <div className="relative aspect-[2/1] w-full overflow-hidden">
                        <img
                          src={
                            wrap.product
                              .thumbnailUrl
                          }
                          alt={`${wrap.product.displayName} wrap design`}
                          loading={
                            localIndex < 3
                              ? "eager"
                              : "lazy"
                          }
                          decoding="async"
                          draggable={false}
                          onError={(event) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              wrap.product
                                .fullImageUrl;
                          }}
                          className="
                            absolute left-1/2 top-1/2
                            h-[204%] w-[52%]
                            max-w-none -translate-x-1/2
                            -translate-y-1/2 rotate-90
                            object-cover transition
                            duration-300
                            group-hover:scale-[1.03]
                          "
                        />
                      </div>
                    </button>

                    <AddToCartControls
                      product={wrap.product}
                    />
                  </article>
                );
              },
            )}
          </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <p
                className="text-sm font-bold text-white"
                style={smokyTextShadow}
              >
                Page {currentPage} of{" "}
                {totalPages}
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
            Handmade with love in Rialto,
            California.
          </p>

          <a
            href={category.footerHref}
            className="mt-5 inline-block text-sm font-bold text-white transition hover:text-red-500"
            style={smokyTextShadow}
          >
            {category.footerLabel}
          </a>
        </footer>
      </div>

      {selectedWrap && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedWrap.product.displayName} image viewer`}
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
            aria-label="Previous wrap"
            className="absolute left-2 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold leading-none text-white shadow-xl transition hover:bg-red-600 sm:left-6 sm:h-14 sm:w-14"
          >
            ‹
          </button>

          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-red-900 bg-black/95 p-3 shadow-2xl sm:p-5"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-white">
              <img
                src={
                  selectedWrap.product
                    .fullImageUrl
                }
                alt={`${selectedWrap.product.displayName} wrap design`}
                draggable={false}
                className="
                  absolute left-1/2 top-1/2
                  h-[200%] w-1/2 max-w-none
                  -translate-x-1/2
                  -translate-y-1/2 rotate-90
                  object-contain
                "
              />
            </div>

            <p
              className="pt-4 text-center text-sm font-bold text-white"
              style={smokyTextShadow}
            >
              {selectedWrap.product.displayName}
              {" • "}
              {(selectedIndex ?? 0) + 1} /{" "}
              {wraps.length}
            </p>

            <AddToCartControls
              product={selectedWrap.product}
              variant="viewer"
            />
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next wrap"
            className="absolute right-2 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold leading-none text-white shadow-xl transition hover:bg-red-600 sm:right-6 sm:h-14 sm:w-14"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
