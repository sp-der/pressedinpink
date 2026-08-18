const sizes = {
  small: { name: "Small", count: 6 },
  medium: { name: "Medium", count: 7 },
  large: { name: "Large", count: 0 },
  "x-large": { name: "X-Large", count: 12 },
  "2x-large": { name: "2X-Large", count: 0 },
  "3x-large": { name: "3X-Large", count: 3 },
} as const;

type SizeSlug = keyof typeof sizes;

export function generateStaticParams() {
  return Object.keys(sizes).map((size) => ({ size }));
}

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function PremadeShirtSizePage({ params }: { params: { size: SizeSlug } }) {
  const size = sizes[params.size];
  const shirts = Array.from(
    { length: size.count },
    (_, index) => `/shirts/premade/${params.size}/shirt-${String(index + 1).padStart(2, "0")}.webp`,
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/homepage-background.jpg')" }} />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-black/40" />

      <div className="relative z-10">
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a href="/shirts/premade" className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold transition hover:bg-red-600" style={smokyTextShadow}>← Premade Shirts</a>
            </div>
            <a href="/" className="flex justify-center">
              <img src="/header-logo.png" alt="Pressed In Pink" className="h-auto max-h-24 w-44 object-contain sm:w-52 md:w-60" />
            </a>
            <div className="hidden md:block" />
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-[2rem] border border-red-900 bg-black/90 p-7 text-center shadow-2xl backdrop-blur-md sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em]" style={smokyTextShadow}>Premade Shirts</p>
            <h1 className="mt-4 text-4xl font-black sm:text-6xl" style={smokyTextShadow}>{size.name}</h1>
            <div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-red-600 bg-red-950/40 p-5">
              <p className="font-bold leading-7" style={smokyTextShadow}>If any premade shirts are not in your size, they are also made to order</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          {shirts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shirts.map((shirt, index) => (
                <article key={shirt} className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-600">
                  <div className="aspect-square bg-black p-3">
                    <img src={shirt} alt={`${size.name} premade shirt ${index + 1}`} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <div className="border-t border-red-950 p-5 text-center">
                    <p className="text-sm font-black uppercase tracking-wider text-red-400">Size {size.name}</p>
                    <a href="https://www.instagram.com/pressed_in_pink/" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-red-600 px-5 py-2 text-sm font-bold transition hover:bg-red-600" style={smokyTextShadow}>Message to Order</a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-3xl border border-red-900 bg-black/90 p-8 text-center shadow-xl backdrop-blur-md sm:p-12">
              <h2 className="text-2xl font-black" style={smokyTextShadow}>No premade {size.name} shirts listed yet</h2>
              <p className="mt-4 leading-7 text-white/75">Message Pressed In Pink to have one of the available designs made in this size.</p>
              <a href="https://www.instagram.com/pressed_in_pink/" target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full border-2 border-red-600 px-7 py-3 font-bold transition hover:bg-red-600" style={smokyTextShadow}>Message to Order</a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
