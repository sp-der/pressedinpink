const sizes = [
  { title: "Small", slug: "small" },
  { title: "Medium", slug: "medium" },
  { title: "Large", slug: "large" },
  { title: "X-Large", slug: "x-large" },
  { title: "2X-Large", slug: "2x-large" },
  { title: "3X-Large", slug: "3x-large" },
];

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function PremadeShirtsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/homepage-background.jpg')" }} />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-black/40" />

      <div className="relative z-10">
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a href="/shirts" className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold transition hover:bg-red-600" style={smokyTextShadow}>← Custom Shirts</a>
            </div>
            <a href="/" className="flex justify-center">
              <img src="/header-logo.png" alt="Pressed In Pink" className="h-auto max-h-24 w-44 object-contain sm:w-52 md:w-60" />
            </a>
            <div className="hidden md:block" />
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/90 p-6 text-center shadow-2xl backdrop-blur-md sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em]" style={smokyTextShadow}>Pressed In Pink Collection</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl md:text-6xl" style={smokyTextShadow}>Premade Shirts</h1>
            <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-red-600 bg-red-950/40 px-5 py-4">
              <p className="font-bold leading-7 text-white" style={smokyTextShadow}>If any premade shirts are not in your size, they are also made to order</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sizes.map((size) => (
              <a key={size.slug} href={`/shirts/premade/${size.slug}`} className="group flex min-h-56 flex-col items-center justify-center rounded-3xl border border-red-900 bg-black/90 p-7 text-center shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-600">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-red-700 bg-red-950/40 text-2xl font-black transition group-hover:border-red-500 group-hover:bg-red-900/30" style={smokyTextShadow}>{size.title}</div>
                <h2 className="mt-6 text-2xl font-black" style={smokyTextShadow}>{size.title}</h2>
                <span className="mt-4 text-sm font-bold text-red-400 transition group-hover:text-red-300">View Shirts →</span>
              </a>
            ))}
          </div>
        </section>

        <footer className="border-t border-red-900 bg-black/90 px-6 py-10 text-center backdrop-blur-md">
          <img src="/header-logo.png" alt="Pressed In Pink" className="mx-auto h-auto w-36 object-contain" />
          <p className="mt-4" style={smokyTextShadow}>Handmade with love in Rialto, California.</p>
        </footer>
      </div>
    </main>
  );
}
