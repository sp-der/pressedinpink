"use client";

import {
  useEffect,
  useState,
} from "react";

import AddToCartControls from "@/components/AddToCartControls";
import {
  getCupProduct,
  parseCupDescriptions,
} from "@/lib/cups";
import type { CupCategoryConfig } from "@/lib/cups";
import { supabase } from "@/lib/supabase";

export default function CupDetail({
  category,
  number,
}: {
  category: CupCategoryConfig;
  number: number;
}) {
  const product = getCupProduct(
    category,
    number,
  );
  const [description, setDescription] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadDescription = async () => {
      const { data } = await supabase
        .from("catalog_categories")
        .select("description")
        .eq("slug", category.databaseSlug)
        .maybeSingle();

      if (!active) {
        return;
      }

      const descriptions =
        parseCupDescriptions(data?.description);

      setDescription(
        descriptions[String(number)] ?? "",
      );
    };

    void loadDescription();

    return () => {
      active = false;
    };
  }, [category.databaseSlug, number]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_1fr] lg:items-start">
        <div className="overflow-hidden rounded-[2rem] border border-red-900 bg-black/90 shadow-2xl">
          <div className="relative aspect-[9/16] bg-black">
            <video
              src={product.fullImageUrl}
              muted
              autoPlay
              loop
              playsInline
              controls
              preload="auto"
              className="h-full w-full object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full border border-red-500 bg-black/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-200 backdrop-blur">
              1 of 1
            </span>
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
              Description
            </p>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-white/80">
              {description ||
                "No extra description has been added for this cup yet."}
            </p>
          </div>

          <AddToCartControls
            product={product}
            variant="viewer"
          />

          <a
            href={`/cups/${category.slug}`}
            className="mt-6 inline-block text-sm font-black text-white underline decoration-red-600 underline-offset-4 transition hover:text-red-400"
          >
            ← Back to {category.displayName}
          </a>
        </div>
      </div>
    </section>
  );
}
