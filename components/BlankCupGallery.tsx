import AddToCartControls from "@/components/AddToCartControls";
import { getBlankCupProducts } from "@/lib/blankCups";
import type { BlankCupCategoryConfig } from "@/lib/blankCups";

export default function BlankCupGallery({
  category,
}: {
  category: BlankCupCategoryConfig;
}) {
  const products = getBlankCupProducts(category);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-500/60 bg-black/80 px-6 py-6 text-center shadow-2xl backdrop-blur-md sm:px-10 sm:py-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
          For Creators • Blank Cups
        </p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">
          {category.displayName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          {category.description}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-red-200/80">
          Choose any quantity and add it to your request cart.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl"
          >
            <a
              href={product.detailHref}
              className="group block"
              aria-label={`Open ${category.displayName} item ${product.imageNumber}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={product.fullImageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4 pb-3">
                <p className="text-sm text-white/60">
                  Tap to view this item.
                </p>
              </div>
            </a>
            <AddToCartControls product={product} />
          </article>
        ))}
      </div>
    </section>
  );
}
