"use client";

import { useState } from "react";

type SportsCategory = {
  title: string;
  description: string;
  href: string;
  image: string;
  fallbackImage: string;
  keywords: string;
  imageScale?: string;
};

const sportsCategories: SportsCategory[] = [
  {
    title: "Dodgers",
    description:
      "Browse Los Angeles Dodgers-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/dodgers",
    image: "/wrap-categories/Sports/dodgers.png",
    fallbackImage: "/wraps/dodgers/thumbnails/dodgers (1).webp",
    keywords:
      "Dodgers Los Angeles baseball MLB blue LA sports team",
    imageScale: "scale-[1.2]",
  },
  {
    title: "Los Angeles Lakers",
    description:
      "Browse Los Angeles Lakers-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/lakers",
    image: "/wrap-categories/Sports/lakers.png",
    fallbackImage: "/wraps/lakers/thumbnails/lakers (1).webp",
    keywords:
      "Los Angeles Lakers LA basketball NBA purple gold sports team",
    imageScale: "scale-[1.15]",
  },
  {
    title: "Los Angeles Clippers",
    description:
      "Browse Los Angeles Clippers-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/clippers",
    image: "/wrap-categories/Sports/clippers.png",
    fallbackImage: "/wraps/clippers/thumbnails/clippers (1).webp",
    keywords:
      "Los Angeles Clippers LA basketball NBA red blue sports team",
    imageScale: "scale-[1.15]",
  },
  {
    title: "Boston Celtics",
    description:
      "Browse Boston Celtics-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/celtics",
    image: "/wrap-categories/Sports/celtics.png",
    fallbackImage: "/wraps/celtics/thumbnails/celtics (1).webp",
    keywords:
      "Boston Celtics basketball NBA green white sports team",
    imageScale: "scale-[1.15]",
  },
  {
    title: "Golden State Warriors",
    description:
      "Browse Golden State Warriors-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/goldenstate",
    image: "/wrap-categories/Sports/goldenstate.png",
    fallbackImage: "/wraps/goldenstate/thumbnails/goldenstate (1).webp",
    keywords:
      "Golden State Warriors basketball NBA blue gold Bay Area sports team",
    imageScale: "scale-[1.15]",
  },
  {
    title: "Denver Nuggets",
    description:
      "Browse Denver Nuggets-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/nuggets",
    image: "/wrap-categories/Sports/nuggets.png",
    fallbackImage: "/wraps/nuggets/thumbnails/nuggets (1).webp",
    keywords:
      "Denver Nuggets basketball NBA blue gold Colorado sports team",
    imageScale: "scale-[1.15]",
  },
  {
    title: "Chicago Bulls",
    description:
      "Browse Chicago Bulls-inspired UV-DTF wrap designs.",
    href: "/wraps/sports/bulls",
    image: "/wrap-categories/Sports/bulls.png",
    fallbackImage: "/wraps/bulls/thumbnails/bulls (1).webp",
    keywords:
      "Chicago Bulls basketball NBA red black sports team",
    imageScale: "scale-[1.15]",
  },
];

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function SportsWrapsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCategories = sportsCategories.filter((category) => {
    const searchableText = `
      ${category.title}
      ${category.description}
      ${category.keywords}
    `.toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

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
          backgroundImage: "url('/homepage-background.jpg')",
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

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/85 p-6 text-center shadow-2xl backdrop-blur-md sm:p-10 md:p-12">
            <p
              className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-white sm:text-sm"
              style={smokyTextShadow}
            >
              Pressed In Pink Collection
            </p>

            <h1
              className="mx-auto max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl md:text-7xl"
              style={smokyTextShadow}
            >
              Sports Wraps
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white sm:text-lg sm:leading-8"
              style={smokyTextShadow}
            >
              Choose a team below to browse available sports wrap designs.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl">
            <label htmlFor="sports-category-search" className="sr-only">
              Search sports categories
            </label>

            <div className="flex items-center gap-3 rounded-full border border-red-900 bg-black/90 px-5 py-3 shadow-xl backdrop-blur-md transition focus-within:border-red-600">
              <span aria-hidden="true" className="text-xl text-white">
                🔍
              </span>

              <input
                id="sports-category-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search teams..."
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/60"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-full border border-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  Clear
                </button>
              )}
            </div>

            <p
              className="mt-3 text-center text-sm text-white"
              style={smokyTextShadow}
            >
              Showing {filteredCategories.length}{" "}
              {filteredCategories.length === 1 ? "team" : "teams"}
            </p>
          </div>

          {filteredCategories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <a
                  key={category.title}
                  href={category.href}
                  className="group flex min-h-72 flex-col items-center rounded-3xl border border-red-900 bg-black/85 p-7 text-center shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-600 hover:bg-black/95"
                >
                  <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-red-900 bg-black/80 p-2 transition duration-300 group-hover:scale-105 group-hover:border-red-600">
                    <img
                      src={category.image}
                      alt={`${category.title} team category`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = category.fallbackImage;
                      }}
                      className={`
                        h-full w-full object-contain
                        transition-transform duration-300
                        ${category.imageScale ?? "scale-100"}
                      `}
                    />
                  </div>

                  <h2
                    className="text-2xl font-black text-white"
                    style={smokyTextShadow}
                  >
                    {category.title}
                  </h2>

                  <p
                    className="mt-4 text-sm leading-6 text-white"
                    style={smokyTextShadow}
                  >
                    {category.description}
                  </p>

                  <div className="mt-auto pt-7">
                    <span
                      className="inline-block rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition group-hover:bg-red-600"
                      style={smokyTextShadow}
                    >
                      View Designs →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-red-900 bg-black/90 px-6 py-12 text-center shadow-xl backdrop-blur-md">
              <h2
                className="text-2xl font-black text-white"
                style={smokyTextShadow}
              >
                No matching teams found
              </h2>

              <p className="mt-3 text-white" style={smokyTextShadow}>
                Try another team, city, league, or sport.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-6 rounded-full border border-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600"
              >
                View All Teams
              </button>
            </div>
          )}
        </section>

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
    </main>
  );
}
