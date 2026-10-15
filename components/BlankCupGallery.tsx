import CollectionHeader from "@/components/CollectionHeader";
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
      <CollectionHeader eyebrow="Pressed In Pink Collection" title={category.displayName}><p>{category.description}</p></CollectionHeader>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="pnp-product-card overflow-hidden rounded-3xl"
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
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl brightness-[0.72] saturate-[1.06]"
                />
                <div className="absolute inset-0 bg-black/10" />
                <img
                  src={product.fullImageUrl}
                  alt=""
                  loading="lazy"
                  className="relative z-10 h-full w-full object-contain object-center brightness-[1.04] contrast-[1.05] saturate-[1.04] transition duration-300 group-hover:scale-[1.015]"
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
