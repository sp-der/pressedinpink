import StorefrontFrame, {
  smokyTextShadow,
} from "@/components/StorefrontFrame";

type CategoryPlaceholderProps = {
  section: "Premade" | "For Creators";
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

export default function CategoryPlaceholder({
  section,
  title,
  description,
  backHref,
  backLabel,
}: CategoryPlaceholderProps) {
  const sectionHref = section === "Premade" ? "/premade" : "/for-creators";
  const resolvedBackHref = backHref ?? sectionHref;
  const resolvedBackLabel = backLabel ?? section;

  return (
    <StorefrontFrame
      backLink={{
        href: resolvedBackHref,
        label: `Back to ${resolvedBackLabel}`,
      }}
      footerLink={{
        href: resolvedBackHref,
        label: `Return to ${resolvedBackLabel}`,
      }}
    >
      <section className="mx-auto flex max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-red-900 bg-black/90 p-7 text-center shadow-2xl backdrop-blur-md sm:p-12">
          <p
            className="text-sm font-black uppercase tracking-[0.24em] text-red-400"
            style={smokyTextShadow}
          >
            {section}
          </p>
          <h1
            className="mt-4 text-4xl font-black sm:text-5xl md:text-6xl"
            style={smokyTextShadow}
          >
            {title}
          </h1>
          <div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-red-800/80 bg-red-950/30 p-5 sm:p-6">
            <p
              className="text-base leading-7 text-white sm:text-lg"
              style={smokyTextShadow}
            >
              {description}
            </p>
          </div>
          <a
            href={resolvedBackHref}
            className="mt-8 inline-flex rounded-full border-2 border-red-600 px-7 py-3 font-bold text-white transition hover:bg-red-600"
            style={smokyTextShadow}
          >
            Browse {resolvedBackLabel}
          </a>
        </div>
      </section>
    </StorefrontFrame>
  );
}
