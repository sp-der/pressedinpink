const categories = [
  {
    title: "Custom Keychains",
    description:
      "Personalized keychains made with your choice of colors, names, themes, characters, and decorative details.",
    icon: "🔑",
  },
  {
    title: "Personalized Accessories",
    description:
      "Browse custom accessories designed to match your style, business, event, or favorite theme.",
    icon: "🎀",
  },
  {
    title: "Custom Gifts & Party Items",
    description:
      "Unique personalized gifts, party favors, and handmade creations for birthdays, celebrations, and special occasions.",
    icon: "🎁",
  },
];

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function AndThingsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Same responsive background used on the homepage */}
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

      {/* Dark tint over the background */}
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
              And Things
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white sm:text-lg sm:leading-8"
              style={smokyTextShadow}
            >
              Browse keychains, accessories, custom gifts, party items, and all
              the extra creations made by Pressed In Pink.
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.title}
                className="group flex min-h-80 flex-col items-center rounded-3xl border border-red-900 bg-black/85 p-7 text-center shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-600 hover:bg-black/95"
              >
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-red-900 bg-black/80 text-4xl transition group-hover:scale-105 group-hover:border-red-600">
                  {category.icon}
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

                <p
                  className="mt-5 text-sm font-bold text-red-500"
                  style={smokyTextShadow}
                >
                  Message for pricing
                </p>

                <div className="mt-auto pt-7">
                  <a
                    href="https://www.instagram.com/pressed_in_pink/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                    style={smokyTextShadow}
                  >
                    Request an Item →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Custom order section */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-900 bg-black/90 p-7 text-center shadow-xl backdrop-blur-md sm:p-10">
            <h2
              className="text-3xl font-black text-white"
              style={smokyTextShadow}
            >
              Looking for something different?
            </h2>

            <p
              className="mx-auto mt-4 max-w-2xl leading-7 text-white"
              style={smokyTextShadow}
            >
              Send us the item, colors, theme, name, character, or special
              occasion you have in mind, and we will help bring your idea to
              life.
            </p>

            <a
              href="https://www.instagram.com/pressed_in_pink/"
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex rounded-full border-2 border-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-600"
              style={smokyTextShadow}
            >
              Message on Instagram
            </a>
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