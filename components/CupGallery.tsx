"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AddToCartControls from "@/components/AddToCartControls";
import LoopingCupVideo from "@/components/LoopingCupVideo";
import {
  getCupProducts,
  parseCupDescriptions,
} from "@/lib/cups";
import type {
  CupCategoryConfig,
  CupDescriptionMap,
} from "@/lib/cups";
import { supabase } from "@/lib/supabase";

export default function CupGallery({
  category,
}: {
  category: CupCategoryConfig;
}) {
  const products = useMemo(
    () => getCupProducts(category),
    [category],
  );
  const [descriptions, setDescriptions] =
    useState<CupDescriptionMap>({});

  useEffect(() => {
    let active = true;

    const loadDescriptions = async () => {
      const { data } = await supabase
        .from("catalog_categories")
        .select("description")
        .eq("slug", category.databaseSlug)
        .maybeSingle();

      if (!active) {
        return;
      }

      setDescriptions(
        parseCupDescriptions(data?.description),
      );
    };

    void loadDescriptions();

    return () => {
      active = false;
    };
  }, [category.databaseSlug]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-500/60 bg-black/80 px-6 py-6 text-center shadow-2xl backdrop-blur-md sm:px-10 sm:py-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
          Premade • One of One
        </p>

        <h1 className="mt-3 text-4xl font-black sm:text-5xl">
          {category.displayName}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          {category.description}
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const description =
            descriptions[String(product.imageNumber)] ?? "";

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl"
            >
              <a
                href={product.detailHref}
                className="group block"
                aria-label={`Open ${category.displayName} item ${product.imageNumber}`}
              >
                <div className="relative aspect-[9/16] overflow-hidden bg-black">
                  <LoopingCupVideo
                    src={product.fullImageUrl}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-red-500 bg-black/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-red-200 backdrop-blur">
                    1 of 1
                  </span>
                </div>

                <div className="p-4 pb-3">
                  {description ? (
                    <p className="line-clamp-2 text-sm leading-6 text-white/65">
                      {description}
                    </p>
                  ) : (
                    <p className="text-sm text-white/50">
                      Tap to view this cup.
                    </p>
                  )}
                </div>
              </a>

              <AddToCartControls
                product={product}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
