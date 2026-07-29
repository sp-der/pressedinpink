"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import WrapGallery from "@/components/WrapGallery";
import { supabase } from "@/lib/supabase";
import type { CatalogCategoryRecord } from "@/types/catalog";
import type { WrapCategoryConfig } from "@/types/wraps";

export default function DynamicWrapCategoryPage() {
  const [category, setCategory] =
    useState<WrapCategoryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    );
    const slug = params.get("slug")?.trim() ?? "";

    if (!slug) {
      setMessage("No category was selected.");
      setLoading(false);
      return;
    }

    const loadCategory = async () => {
      const { data, error } = await supabase
        .from("catalog_categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setMessage(
          error?.message ?? "Category not found.",
        );
        setLoading(false);
        return;
      }

      const record = data as CatalogCategoryRecord;

      setCategory({
        slug: record.slug,
        displayName: record.display_name,
        heading: record.heading,
        itemLabel: record.item_label,
        filenamePrefix: record.filename_prefix,
        imageFolder: record.image_folder,
        totalImages: record.base_image_count,
        backHref: "/wraps",
        backLabel: "Back to Wraps",
        footerHref: "/wraps",
        footerLabel: "Return to Wraps",
      });
      setLoading(false);
    };

    void loadCategory();
  }, []);

  if (loading) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Collection"
        title="Loading Wraps"
        description="Opening the live category."
        backHref="/wraps"
        backLabel="Back to Wraps"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  if (!category) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Collection"
        title="Category Not Found"
        description={message}
        backHref="/wraps"
        backLabel="Back to Wraps"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          <a
            href="/wraps"
            className="inline-block rounded-full bg-red-600 px-7 py-3 font-black transition hover:bg-red-500"
          >
            Browse Categories
          </a>
        </div>
      </AuthPageShell>
    );
  }

  return <WrapGallery category={category} />;
}
