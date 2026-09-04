"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import {
  CUP_CATEGORIES,
  getCupProducts,
  parseCupDescriptions,
  serializeCupDescriptions,
} from "@/lib/cups";
import type {
  CupCategoryConfig,
  CupDescriptionMap,
} from "@/lib/cups";
import { supabase } from "@/lib/supabase";

type CupCatalogRecord = {
  id: string;
  slug: string;
  description: string;
};

function categorySeed(
  category: CupCategoryConfig,
  displayOrder: number,
) {
  return {
    slug: category.databaseSlug,
    parent_slug: "cups",
    display_name: category.displayName,
    heading: category.displayName,
    item_label: category.itemLabel,
    filename_prefix: category.filenamePrefix.toLowerCase(),
    image_folder: category.databaseSlug,
    description: serializeCupDescriptions({}),
    keywords: "premade cups one of one",
    card_image_url: "",
    image_scale: "scale-100",
    base_image_count: 0,
    display_order: displayOrder,
    is_active: true,
  };
}

export default function AdminCupsPage() {
  const { user, loading, isAdmin } = useAuth();
  const [selectedSlug, setSelectedSlug] =
    useState(CUP_CATEGORIES[0].slug);
  const [records, setRecords] = useState<
    Record<string, CupCatalogRecord>
  >({});
  const [descriptions, setDescriptions] =
    useState<CupDescriptionMap>({});
  const [loadingCups, setLoadingCups] =
    useState(true);
  const [savingNumber, setSavingNumber] =
    useState<number | null>(null);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedCategory = useMemo(
    () =>
      CUP_CATEGORIES.find(
        (category) => category.slug === selectedSlug,
      ) ?? CUP_CATEGORIES[0],
    [selectedSlug],
  );

  const products = useMemo(
    () => getCupProducts(selectedCategory),
    [selectedCategory],
  );

  const loadCupCatalog = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setLoadingCups(true);
    setErrorMessage("");

    try {
      const databaseSlugs = CUP_CATEGORIES.map(
        (category) => category.databaseSlug,
      );
      const { data, error } = await supabase
        .from("catalog_categories")
        .select("id, slug, description")
        .in("slug", databaseSlugs);

      if (error) {
        throw error;
      }

      const existing = new Map(
        ((data ?? []) as CupCatalogRecord[]).map(
          (record) => [record.slug, record],
        ),
      );

      for (
        let index = 0;
        index < CUP_CATEGORIES.length;
        index += 1
      ) {
        const category = CUP_CATEGORIES[index];

        if (existing.has(category.databaseSlug)) {
          continue;
        }

        const { data: inserted, error: insertError } =
          await supabase
            .from("catalog_categories")
            .insert(
              categorySeed(category, 9000 + index),
            )
            .select("id, slug, description")
            .single();

        if (insertError) {
          throw insertError;
        }

        existing.set(
          category.databaseSlug,
          inserted as CupCatalogRecord,
        );
      }

      setRecords(
        Object.fromEntries(existing.entries()),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The premade cup manager could not load.",
      );
    } finally {
      setLoadingCups(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !isAdmin) {
      window.location.replace("/admin/login");
      return;
    }

    void loadCupCatalog();
  }, [
    loading,
    user,
    isAdmin,
    loadCupCatalog,
  ]);

  useEffect(() => {
    const record = records[
      selectedCategory.databaseSlug
    ];

    setDescriptions(
      parseCupDescriptions(record?.description),
    );
    setSuccessMessage("");
  }, [records, selectedCategory.databaseSlug]);

  const saveDescription = async (
    number: number,
  ) => {
    const record = records[
      selectedCategory.databaseSlug
    ];

    if (!record) {
      setErrorMessage(
        "This cup category is still initializing. Refresh and try again.",
      );
      return;
    }

    setSavingNumber(number);
    setErrorMessage("");
    setSuccessMessage("");

    const nextDescriptions = {
      ...descriptions,
      [String(number)]:
        (descriptions[String(number)] ?? "").trim(),
    };

    try {
      const serialized =
        serializeCupDescriptions(nextDescriptions);
      const { data, error } = await supabase
        .from("catalog_categories")
        .update({ description: serialized })
        .eq("id", record.id)
        .select("id, slug, description")
        .single();

      if (error) {
        throw error;
      }

      setDescriptions(nextDescriptions);
      setRecords((current) => ({
        ...current,
        [selectedCategory.databaseSlug]:
          data as CupCatalogRecord,
      }));
      setSuccessMessage(
        `${selectedCategory.itemLabel} ${number} description saved.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The description could not be saved.",
      );
    } finally {
      setSavingNumber(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Admin"
        title="Checking Cup Manager Access"
        description="Verifying the administrator account."
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Pressed In Pink Admin"
      title="Premade Cup Manager"
      description="Edit the optional description shown on each one-of-one premade cup page."
      backHref="/admin/orders"
      backLabel="Back to Orders"
      maxWidthClass="max-w-7xl"
    >
      {successMessage && (
        <div className="mb-5 rounded-2xl border border-green-500 bg-green-500/15 p-4 font-bold text-green-100">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 font-bold text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="rounded-3xl border border-red-900 bg-black/90 p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block flex-1">
            <span className="text-sm font-black">
              Cup category
            </span>
            <select
              value={selectedSlug}
              onChange={(event) =>
                setSelectedSlug(
                  event.target.value as typeof selectedSlug,
                )
              }
              className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            >
              {CUP_CATEGORIES.map((category) => (
                <option
                  key={category.slug}
                  value={category.slug}
                >
                  {category.displayName} ({category.count})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/cups/${selectedCategory.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-red-600 px-5 py-3 text-sm font-black transition hover:bg-red-600"
            >
              Open Customer Category
            </a>
            <button
              type="button"
              onClick={() => void loadCupCatalog()}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-black transition hover:bg-red-500"
            >
              Refresh
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/60">
          The videos stay in R2. This tool only saves the optional text attached to each cup, so you can update copy without re-uploading the video.
        </p>
      </div>

      {loadingCups ? (
        <div className="mt-6 rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading premade cups…
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl"
            >
              <div className="grid grid-cols-[132px_1fr] gap-0 sm:grid-cols-[150px_1fr]">
                <div className="relative aspect-[9/16] bg-black">
                  <video
                    src={product.fullImageUrl}
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-col p-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-red-400">
                      One of One
                    </p>
                    <h2 className="mt-1 text-lg font-black">
                      {product.displayName}
                    </h2>
                  </div>

                  <label className="mt-4 block flex-1">
                    <span className="text-xs font-black text-white/65">
                      Optional description
                    </span>
                    <textarea
                      value={
                        descriptions[
                          String(product.imageNumber)
                        ] ?? ""
                      }
                      onChange={(event) =>
                        setDescriptions((current) => ({
                          ...current,
                          [String(product.imageNumber)]:
                            event.target.value,
                        }))
                      }
                      rows={5}
                      placeholder="Add details about this cup, colors, theme, included lid/straw, etc."
                      className="mt-2 min-h-[120px] w-full resize-y rounded-2xl border border-red-900 bg-black px-3 py-3 text-sm text-white outline-none focus:border-red-500"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-red-950 p-4">
                <a
                  href={product.detailHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black text-white underline decoration-red-600 underline-offset-4"
                >
                  View Item Page
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void saveDescription(
                      product.imageNumber,
                    )
                  }
                  disabled={
                    savingNumber === product.imageNumber
                  }
                  className="rounded-full bg-red-600 px-5 py-2 text-xs font-black transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingNumber === product.imageNumber
                    ? "Saving…"
                    : "Save Description"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AuthPageShell>
  );
}
