// PNP shirts deployment refresh
const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function ShirtsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-no-repeat bg-[position:62%_top] sm:bg-[position:58%_top] md:bg-center"
        style={{ backgroundImage: "url('/homepage-background.jpg')" }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-black/35" />

      <div className="relative z-10">
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a href="/premade" className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600" style={smokyTextShadow}>
                ← Back to Premade
              </a>
            </div>
            <a href="/" className="flex justify-center">
              <img src="/header-logo.png" alt="Pressed In Pink" className="h-auto max-h-24 w-44 object-contain sm:w-52 md:w-60" />
            </a>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <a href="https://www.instagram.com/pressed_in_pink/" target="_blank" rel="noreferrer" className="rounded-full border-2 border-red-600 px-5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-black">Instagram</a>
              <a href="https://www.tiktok.com/@pressedinpink23?lang=en" target="_blank" rel="noreferrer" className="rounded-full border-2 border-red-600 px-5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-black">TikTok</a>
            </div>
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/85 p-6 text-center shadow-2xl backdrop-blur-md sm:p-10 md:p-12">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-white sm:text-sm" style={smokyTextShadow}>Pressed In Pink Collection</p>
            <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl md:text-7xl" style={smokyTextShadow}>Premade Shirts</h1>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-md">
            <a href="/shirts/premade" className="group flex min-h-96 flex-col overflow-hidden rounded-3xl border border-red-900 bg-black/85 text-center shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-600 hover:bg-black/95">
              <div className="aspect-square w-full overflow-hidden border-b border-red-900 bg-black">
                <img src="/premade-shirts-category.png" alt="Premade shirts" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col items-center p-7">
                <h2 className="text-2xl font-black text-white" style={smokyTextShadow}>Premade Shirts</h2>
                <span className="mt-6 inline-block rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition group-hover:bg-red-600" style={smokyTextShadow}>View Shirts →</span>
              </div>
            </a>
          </div>
        </section>

        <footer className="border-t border-red-900 bg-black/90 px-6 py-10 text-center backdrop-blur-md">
          <img src="/header-logo.png" alt="Pressed In Pink" className="mx-auto h-auto w-36 object-contain" />
          <p className="mt-4 text-white" style={smokyTextShadow}>Handmade with love in Rialto, California.</p>
          <a href="/premade" className="mt-5 inline-block text-sm font-bold text-white transition hover:text-red-500" style={smokyTextShadow}>Return to Premade</a>
        </footer>
      </div>
    </main>
  );
}
