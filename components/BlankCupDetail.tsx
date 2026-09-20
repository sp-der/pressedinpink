import AddToCartControls from "@/components/AddToCartControls";
import { getBlankCupProduct } from "@/lib/blankCups";
import type { BlankCupCategoryConfig } from "@/lib/blankCups";

export default function BlankCupDetail({
  category,
  number,
}: {
  category: BlankCupCategoryConfig;
  number: number;
}) {
  const product = getBlankCupProduct(category, number);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,620px)_1fr] lg:items-start">
        <div className="overflow-hidden rounded-[2rem] border border-red-900 shadow-2xl">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={product.fullImageUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-red-900 bg-black/90 p-6 shadow-2xl sm:p-8">
          <div className="inline-flex max-w-full items-center justify-center rounded-full border border-red-500/60 bg-black/75 px-6 py-3 shadow-xl backdrop-blur-md">
            <h1 className="text-3xl font-black sm:text-4xl">
              {category.displayName}
            </h1>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-white/55">
              Request quantity
            </p>
            <p className="mt-3 leading-7 text-white/80">
              Select how many you need and add them to your request cart.
            </p>
          </div>

          <AddToCartControls product={product} variant="viewer" />

          <a
            href={`/for-creators/blank-cups/${category.slug}`}
            className="mt-6 inline-block text-sm font-black text-white underline decoration-red-600 underline-offset-4 transition hover:text-red-400"
          >
            ← Back to {category.displayName}
          </a>
        </div>
      </div>
    </section>
  );
}
