const sizes = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  "x-large": "X-Large",
  "2x-large": "2X-Large",
  "3x-large": "3X-Large",
} as const;

type SizeSlug = keyof typeof sizes;

export function generateStaticParams() {
  return Object.keys(sizes).map((size) => ({ size }));
}

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function PremadeShirtSizePage({
  params,
}: {
  params: { size: SizeSlug };
}) {
  const sizeName = sizes[params.size];

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

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="rounded-[2rem] border border-red-900 bg-black/90 p-8 text-center shadow-2xl backdrop-blur-md sm:p-12">
            <p className="text-xs font-black uppercase tracking-[0.3em]" style={smokyTextShadow}>Premade Shirts</p>
            <h1 className="mt-4 text-4xl font-black sm:text-6xl" style={smokyTextShadow}>{sizeName}</h1>
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-600 bg-red-950/40 p-5">
              <p className="font-bold leading-7" style={smokyTextShadow}>If any premade shirts are not in your size, they are also made to order</p>
            </div>
            <p className="mx-auto mt-8 max-w-xl leading-7 text-white/80">Premade shirts in this size will appear here as they are added.</p>
            <a href="https://www.instagram.com/pressed_in_pink/" target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full border-2 border-red-600 px-7 py-3 font-bold transition hover:bg-red-600" style={smokyTextShadow}>Message to Order</a>
          </div>
        </section>
      </div>
    </main>
  );
}
