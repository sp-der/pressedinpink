export default function Home() {
  return (
    <main className="min-h-screen bg-[#fff8fb] text-[#24151b]">
      <nav className="flex items-center justify-between px-6 py-5">
        <div className="text-2xl font-bold tracking-tight">Pressed In Pink</div>
        <a
          href="https://www.instagram.com/pressed_in_pink/"
          target="_blank"
          className="rounded-full bg-[#ff4f8d] px-5 py-2 text-sm font-semibold text-white shadow-md"
        >
          Instagram
        </a>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#ff4f8d]">
            Rialto, CA
          </p>

          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Custom creations made to stand out.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f4b58]">
            Browse handmade cups, shirts, keychains, custom gifts, and thousands
            of UV-DTF wraps. See something you love? Message us on Instagram to order.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://www.instagram.com/pressed_in_pink/"
              target="_blank"
              className="rounded-full border-2 border-[#ff4f8d] px-6 py-3 font-bold text-[#ff4f8d]"
            >
              Message to Order
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <img
            src="/logo.png"
            alt="Pressed In Pink Logo"
            className="mx-auto w-full max-w-md"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-black">Shop by Category</h2>
        <p className="mt-2 text-[#6f4b58]">
          A boutique-style catalog for all things pink, custom, and creative.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["UV-DTF Wraps", "Thousands of designs ready to browse.", "/wraps"],
            ["Cups", "Snowglobes, glass cans, and custom tumblers.", "/cups"],
            ["Shirts", "Personalized apparel for any occasion.", "/shirts"],
            ["Keychains", "Small gifts with big personality.", "/keychains"],
          ].map(([title, text, href]) => (
            <a
              key={title}
              href={href}
              className="group rounded-3xl border border-pink-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 text-3xl">🌸</div>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f4b58]">{text}</p>
              <span className="mt-5 inline-block rounded-full bg-[#ffe1ec] px-4 py-2 text-sm font-bold text-[#ff4f8d] group-hover:bg-[#ff4f8d] group-hover:text-white transition">
                View Collection
              </span>
            </a>
          ))}
        </div>
      </section>

      <footer className="mt-16 bg-white px-6 py-10 text-center">
        <h3 className="text-2xl font-black">Pressed In Pink</h3>
        <p className="mt-2 text-[#6f4b58]">
          Handmade with love in Rialto, California.
        </p>
      </footer>
    </main>
  );
}
