import { smokyTextShadow } from "@/components/StorefrontFrame";

export type CollectionHubItem = {
  title: string;
  description: string;
  action: string;
  href?: string;
  image?: string;
  imageFit?: "cover" | "contain";
  label?: string;
  monogram?: string;
};

type CollectionHubProps = {
  eyebrow: string;
  title: string;
  description: string;
  heroAction?: {
    label: string;
    href: string;
  };
  items: CollectionHubItem[];
  layout?: "cards" | "circles";
};

function CardContents({ item }: { item: CollectionHubItem }) {
  return (
    <>
      <div className="relative flex aspect-[5/3] w-full items-center justify-center overflow-hidden border-b border-red-950 bg-[linear-gradient(135deg,rgba(69,10,10,0.95),rgba(0,0,0,0.98))]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.18),transparent_62%)]"
        />
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className={`relative h-full w-full transition duration-500 group-hover:scale-105 ${
              item.imageFit === "contain"
                ? "object-contain p-7"
                : "object-cover"
            }`}
          />
        ) : (
          <span
            className="relative max-w-full break-words px-4 text-center text-3xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl"
            style={smokyTextShadow}
          >
            {item.monogram ?? item.title}
          </span>
        )}
        {item.label ? (
          <span className="absolute right-4 top-4 rounded-full border border-red-500/80 bg-black/85 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-300">
            {item.label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h2
          className="text-2xl font-black text-white sm:text-3xl"
          style={smokyTextShadow}
        >
          {item.title}
        </h2>
        <p
          className="mt-3 text-base leading-7 text-white/90"
          style={smokyTextShadow}
        >
          {item.description}
        </p>
        <div className="mt-auto pt-7">
          <span
            className={`inline-flex rounded-full border px-5 py-2 text-sm font-bold transition ${
              item.href
                ? "border-red-600 text-white group-hover:bg-red-600"
                : "border-white/25 text-white/65"
            }`}
            style={smokyTextShadow}
          >
            {item.action}
          </span>
        </div>
      </div>
    </>
  );
}

export default function CollectionHub({
  eyebrow,
  title,
  description,
  heroAction,
  items,
  layout = "cards",
}: CollectionHubProps) {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/85 p-6 text-center shadow-2xl backdrop-blur-md sm:p-10">
          <p
            className="text-sm font-black uppercase tracking-[0.24em] text-red-400"
            style={smokyTextShadow}
          >
            {eyebrow}
          </p>
          <h1
            className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl"
            style={smokyTextShadow}
          >
            {title}
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white sm:text-lg"
            style={smokyTextShadow}
          >
            {description}
          </p>
          {heroAction ? (
            <div className="mt-8 flex justify-center">
              <a
                href={heroAction.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border-2 border-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-600"
                style={smokyTextShadow}
              >
                {heroAction.label}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {layout === "circles" ? (
        <section aria-label="Choose how to shop" className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 pb-12 sm:gap-16 sm:px-6 sm:pb-16">
          <div aria-hidden="true" className="absolute bottom-12 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-red-500/80 to-transparent sm:bottom-16" />
          {items.map((item) => (
            <div key={item.title} className="flex min-w-0 flex-col items-center text-center">
              <a
                href={item.href}
                aria-label={item.title}
                className="group relative flex aspect-square w-full max-w-[25rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-full border border-red-700 bg-[radial-gradient(circle_at_35%_25%,rgba(100,15,15,0.96),rgba(0,0,0,0.98)_75%)] p-4 text-white shadow-xl transition duration-300 hover:border-red-400 hover:shadow-[0_0_45px_rgba(185,28,28,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 motion-safe:hover:scale-[1.025] sm:gap-5 sm:p-8"
              >
                {item.image ? (
                  <img src={item.image} alt="" className="h-[38%] w-[48%] object-contain" />
                ) : null}
                <h2 className="max-w-full text-center text-base font-black uppercase leading-tight tracking-wide min-[400px]:text-lg sm:text-3xl lg:text-4xl" style={smokyTextShadow}>
                  {item.title}
                </h2>
                <span aria-hidden="true" className="text-lg text-red-300 transition-transform group-hover:translate-x-1 sm:text-2xl">→</span>
              </a>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-red-300 sm:text-xs">{item.label}</p>
            </div>
          ))}
        </section>
      ) : (
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div
          className={`grid gap-6 sm:grid-cols-2 ${
            items.length === 2
              ? "mx-auto max-w-5xl"
              : items.length === 4
                ? "xl:grid-cols-4"
                : "lg:grid-cols-3"
          }`}
        >
          {items.map((item) =>
            item.href ? (
              <a
                key={item.title}
                href={item.href}
                className="group flex min-h-[25rem] flex-col overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-[0_20px_55px_rgba(127,29,29,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
              >
                <CardContents item={item} />
              </a>
            ) : (
              <article
                key={item.title}
                aria-disabled="true"
                className="group flex min-h-[25rem] flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/80 shadow-xl backdrop-blur-md"
              >
                <CardContents item={item} />
              </article>
            ),
          )}
        </div>
      </section>
      )}
    </>
  );
}
