const categories = [
  {
    title: "UV-DTF Wraps",
    text: "Thousands of designs ready to browse.",
    href: "/wraps",
  },
  {
    title: "Cups",
    text: "Snowglobes, Glass Cans, Acrylics & Stainless Steel",
    href: "/cups",
  },
  {
    title: "Shirts",
    text: "Personalized apparel for any occasion.",
    href: "/shirts",
  },
  {
    title: "& More",
    text: "Keychains, accessories, gifts, and more.",
    href: "/keychains",
  },
];

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Responsive centered background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/homepage-background.jpg')",
        }}
      />

      {/* Dark tint over background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/30"
      />

      <div className="relative z-10">
        {/* Header */}
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="hidden md:block" />

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

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 md:py-32">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/85 p-6 text-center shadow-2xl backdrop-blur-md sm:p-10 md:p-12">
            <p
              className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-white sm:text-sm"
              style={smokyTextShadow}
            >
              Rialto, CA
            </p>

            <h1
              className="mx-auto max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl md:text-7xl"
              style={smokyTextShadow}
            >
              Made for Creators Built for Custom & Where Custom Meets Creativity
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white sm:text-lg sm:leading-8"
              style={smokyTextShadow}
            >
              Here you can order a custom cup from Pressed in Pink or browse
              wraps, blanks, bundles, and supplies to create your own.
            </p>

            <div className="mt-8 flex justify-center">
              <a
                href="https://www.instagram.com/pressed_in_pink/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border-2 border-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-600 hover:text-white"
                style={smokyTextShadow}
              >
                Message to Order
              </a>
            </div>
          </div>
        </section>

        {/* Category heading */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-red-950/80 bg-black/85 p-6 text-center shadow-xl backdrop-blur-md">
            <h2
              className="text-3xl font-black text-white sm:text-4xl"
              style={smokyTextShadow}
            >
              Shop by Category
            </h2>

            <p className="mt-3 text-white" style={smokyTextShadow}>
              Browse premade and available products.
            </p>
          </div>

          {/* Category cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <a
                key={category.title}
                href={category.href}
                className="group flex min-h-64 flex-col items-center rounded-3xl border border-red-900 bg-black/85 p-6 text-center shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-600 hover:bg-black/95"
              >
                <div className="mb-4 text-3xl"></div>

                <h3
                  className="text-xl font-black text-white"
                  style={smokyTextShadow}
                >
                  {category.title}
                </h3>

                <p
                  className="mt-3 text-sm leading-6 text-white"
                  style={smokyTextShadow}
                >
                  {category.text}
                </p>

                <div className="mt-auto pt-6">
                  <span
                    className="inline-block rounded-full border border-red-600 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-red-600 group-hover:text-white"
                    style={smokyTextShadow}
                  >
                    View Collection
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-red-900 bg-black/90 px-6 py-10 text-center backdrop-blur-md">
          <img
            src="/header-logo.png"
            alt="Pressed In Pink"
            className="mx-auto h-auto w-36 object-contain"
          />

          <p className="mt-4 text-white" style={smokyTextShadow}>
            Handmade with love in Rialto, California.
          </p>
        </footer>
      </div>
    </main>
  );
}
