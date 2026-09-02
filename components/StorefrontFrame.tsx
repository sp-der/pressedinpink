import type { ReactNode } from "react";

type NavigationLink = {
  href: string;
  label: string;
};

type StorefrontFrameProps = {
  children: ReactNode;
  backLink?: NavigationLink;
  footerLink?: NavigationLink;
};

export const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function StorefrontFrame({
  children,
  backLink,
  footerLink,
}: StorefrontFrameProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-no-repeat bg-[position:62%_top] sm:bg-[position:58%_top] md:bg-center"
        style={{ backgroundImage: "url('/homepage-background.jpg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(190,24,93,0.14),transparent_34%)]"
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            {backLink ? (
              <div className="flex justify-center md:justify-start">
                <a
                  href={backLink.href}
                  className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                  style={smokyTextShadow}
                >
                  ← {backLink.label}
                </a>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}

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
                className="rounded-full border-2 border-red-600 px-5 py-2 text-sm font-bold text-red-500 transition hover:bg-red-600 hover:text-white"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@pressedinpink23?lang=en"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border-2 border-red-600 px-5 py-2 text-sm font-bold text-red-500 transition hover:bg-red-600 hover:text-white"
              >
                TikTok
              </a>
            </div>
          </div>
        </nav>

        <div className="flex-1">{children}</div>

        <footer className="mt-16 border-t border-red-900 bg-black/90 px-6 py-10 text-center backdrop-blur-md">
          <img
            src="/header-logo.png"
            alt="Pressed In Pink"
            className="mx-auto h-auto w-36 object-contain"
          />
          <p className="mt-4 text-white" style={smokyTextShadow}>
            Handmade with love in Rialto, California.
          </p>
          {footerLink ? (
            <a
              href={footerLink.href}
              className="mt-5 inline-block text-sm font-bold text-white transition hover:text-red-400"
              style={smokyTextShadow}
            >
              {footerLink.label}
            </a>
          ) : null}
        </footer>
      </div>
    </main>
  );
}
