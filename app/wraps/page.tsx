"use client";

import { useState } from "react";

type WrapCategory = {
  title: string;
  description: string;
  href: string;
  image: string;
  keywords: string;
  imageScale?: string;
};

const wrapCategories: WrapCategory[] = [
  {
    title: "90s Cartoons",
    description:
      "Browse nostalgic designs inspired by classic cartoons and characters.",
    href: "/wraps/90scartoons",
    image: "/wrap-categories/90s Cartoons.png",
    keywords:
      "90s cartoons retro nostalgic Nickelodeon Cartoon Network characters",
    imageScale: "scale-[1.65]",
  },
  {
    title: "Sports",
    description:
      "Browse team-inspired, game-day, and sports-themed UV-DTF wraps.",
    href: "/wraps/sports",
    image: "/wrap-categories/Sports.png",
    keywords:
      "sports football basketball baseball soccer teams game day athletes",
    imageScale: "scale-[1.25]",
  },
  {
  title: "Hello Kitty and Friends",
  description:
    "Browse Hello Kitty, Sanrio friends, and other cute character wrap designs.",
  href: "/wraps/hello-kitty",
  image: "/wrap-categories/Hello Kitty.png",
  keywords:
    "Hello Kitty Sanrio friends cute kawaii pink characters Kuromi My Melody Cinnamoroll",
  imageScale: "scale-[1.25]",
},
  {
    title: "Anime",
    description:
      "Browse anime-inspired characters, series, artwork, and colorful UV-DTF wraps.",
    href: "/wraps/anime",
    image: "/wrap-categories/Anime.png",
    keywords:
      "anime manga Japanese series characters cartoons colorful",
    imageScale: "scale-100",
  },
  {
    title: "K-Pop",
    description:
      "Browse K-pop-inspired groups, artists, albums, and fan-favorite UV-DTF wraps.",
    href: "/wraps/kpop",
    image: "/wrap-categories/K-pop.png",
    keywords:
      "K-pop kpop Korean music groups idols artists albums",
    imageScale: "scale-[1.45]",
  },
  {
  title: "Villains",
  description:
    "Browse iconic villains, dark characters, and wickedly fun UV-DTF wrap designs.",
  href: "/wraps/villians",
  image: "/wrap-categories/villians.png",
  keywords:
    "villains villians evil dark characters Disney horror bad guys antagonists",
    imageScale: "scale-[1.85]",
},
  {
    title: "Music",
    description:
      "Browse music-inspired artists, albums, lyrics, and fan-favorite designs.",
    href: "/wraps/music",
    image: "/wrap-categories/music.png",
    keywords:
      "music musicians artists singers rappers albums lyrics bands concerts",
    imageScale: "scale-[1.25]",
  },
  {
    title: "420",
    description:
      "Browse bold, colorful, and laid-back 420-inspired wrap designs.",
    href: "/wraps/420",
    image: "/wrap-categories/420.png",
    keywords:
      "420 cannabis weed marijuana smoke smoking green stoner",
    imageScale: "scale-[1.25]",
  },
  {
    title: "Clearance",
    description:
      "Browse discounted wrap designs available while supplies last.",
    href: "/wraps/clearance",
    image: "/wrap-categories/clearance.png",
    keywords:
      "clearance discount discounted sale deals cheap last chance",
    imageScale: "scale-[1.25]",
  },
];

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function WrapsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCategories = wrapCategories.filter((category) => {
    const searchableText = `
      ${category.title}
      ${category.description}
      ${category.keywords}
    `.toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

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

      {/* Dark background tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/35"
      />

      <div className="relative z-10">
        {/* Header */}
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a
                href="/"
                className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                style={smokyTextShadow}
              >
                ← Back Home
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

        {/* Page heading */}
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
              UV-DTF Wraps
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white sm:text-lg sm:leading-8"
              style={smokyTextShadow}
            >
              Choose a category below to browse available wrap designs.
            </p>
          </div>
        </section>

        {/* Wrap categories */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          {/* Category search */}
          <div className="mx-auto mb-10 max-w-2xl">
            <label htmlFor="wrap-category-search" className="sr-only">
              Search wrap categories
            </label>

            <div className="flex items-center gap-3 rounded-full border border-red-900 bg-black/90 px-5 py-3 shadow-xl backdrop-blur-md transition focus-within:border-red-600">
              <span aria-hidden="true" className="text-xl text-white">
                🔍
              </span>

              <input
                id="wrap-category-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search wrap categories..."
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
              {filteredCategories.length === 1
                ? "category"
                : "categories"}
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
                  {/* Category image */}
                  <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-red-900 bg-black/80 p-2 transition duration-300 group-hover:scale-105 group-hover:border-red-600">
                    <img
                      src={category.image}
                      alt={`${category.title} category`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
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
                No matching categories found
              </h2>

              <p className="mt-3 text-white" style={smokyTextShadow}>
                Try another character, theme, team, artist, or style.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-6 rounded-full border border-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600"
              >
                View All Categories
              </button>
            </div>
          )}
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
            href="/"
            className="mt-5 inline-block text-sm font-bold text-white transition hover:text-red-500"
            style={smokyTextShadow}
          >
            Return Home
          </a>
        </footer>
      </div>
    </main>
  );
}