
import type { ReactNode } from "react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  maxWidthClass?: string;
};

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function AuthPageShell({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Back Home",
  children,
  maxWidthClass = "max-w-3xl",
}: AuthPageShellProps) {
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
          backgroundImage:
            "url('/homepage-background.jpg')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/50"
      />

      <div className="relative z-10">
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a
                href={backHref}
                className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                style={smokyTextShadow}
              >
                ← {backLabel}
              </a>
            </div>

            <a
              href="/"
              className="flex justify-center"
            >
              <img
                src="/header-logo.png"
                alt="Pressed In Pink"
                className="h-auto max-h-24 w-44 object-contain sm:w-52 md:w-60"
              />
            </a>

            <div />
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div
            className={`mx-auto ${maxWidthClass}`}
          >
            <div className="rounded-[2rem] border border-red-900/80 bg-black/85 p-7 text-center shadow-2xl backdrop-blur-md sm:p-10">
              <p
                className="text-xs font-black uppercase tracking-[0.3em] text-white sm:text-sm"
                style={smokyTextShadow}
              >
                {eyebrow}
              </p>

              <h1
                className="mt-4 text-4xl font-black text-white sm:text-5xl"
                style={smokyTextShadow}
              >
                {title}
              </h1>

              <p
                className="mx-auto mt-5 max-w-2xl leading-7 text-white"
                style={smokyTextShadow}
              >
                {description}
              </p>
            </div>

            <div className="mt-8">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
