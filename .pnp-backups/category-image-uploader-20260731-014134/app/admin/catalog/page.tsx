"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type {
  CatalogCategoryRecord,
  CatalogUploadResult,
  CatalogWrapRecord,
} from "@/types/catalog";

type RecentWrap = CatalogWrapRecord & {
  catalog_categories:
    | {
        display_name: string;
        slug: string;
      }
    | {
        display_name: string;
        slug: string;
      }[]
    | null;
};

type UploadProgress = {
  filename: string;
  status: "waiting" | "converting" | "uploading" | "done" | "error";
  message: string;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function prefixFromName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 80);
}

async function convertToWebp(
  file: File,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxDimension /
      Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(
    1,
    Math.round(bitmap.width * scale),
  );
  const height = Math.max(
    1,
    Math.round(bitmap.height * scale),
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    bitmap.close();
    throw new Error(
      "This browser could not prepare the image.",
    );
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!webp) {
    throw new Error(
      "This browser could not convert the image to WebP.",
    );
  }

  return webp;
}

function categoryLabel(
  recent: RecentWrap,
): string {
  const relation = recent.catalog_categories;

  if (Array.isArray(relation)) {
    return relation[0]?.display_name ?? "Category";
  }

  return relation?.display_name ?? "Category";
}

export default function AdminCatalogPage() {
  const { user, loading, isAdmin } = useAuth();
  const [categories, setCategories] = useState<
    CatalogCategoryRecord[]
  >([]);
  const [recentWraps, setRecentWraps] = useState<
    RecentWrap[]
  >([]);
  const [selectedSlug, setSelectedSlug] =
    useState("princesses");
  const [creatingCategory, setCreatingCategory] =
    useState(false);
  const [categoryName, setCategoryName] =
    useState("");
  const [categorySlug, setCategorySlug] =
    useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [filenamePrefix, setFilenamePrefix] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [keywords, setKeywords] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<
    UploadProgress[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadCatalog = useCallback(async () => {
    const [categoryResult, wrapResult] = await Promise.all([
      supabase
        .from("catalog_categories")
        .select("*")
        .order("display_order", { ascending: true })
        .order("display_name", { ascending: true }),
      supabase
        .from("catalog_wraps")
        .select(
          `
            *,
            catalog_categories (
              display_name,
              slug
            )
          `,
        )
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (categoryResult.error) {
      setErrorMessage(
        `Catalog setup is not ready: ${categoryResult.error.message}`,
      );
      return;
    }

    setCategories(
      (categoryResult.data ?? []) as CatalogCategoryRecord[],
    );
    setRecentWraps(
      (wrapResult.data ?? []) as unknown as RecentWrap[],
    );
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !isAdmin) {
      window.location.replace("/admin/login");
      return;
    }

    void loadCatalog();
  }, [loading, user, isAdmin, loadCatalog]);

  useEffect(() => {
    if (!creatingCategory) {
      return;
    }

    const nextSlug = slugify(categoryName);
    const nextPrefix = prefixFromName(categoryName);

    setCategorySlug((current) =>
      current ? current : nextSlug,
    );
    setFilenamePrefix((current) =>
      current ? current : nextPrefix,
    );
    setItemLabel((current) =>
      current ? current : categoryName.trim(),
    );
  }, [categoryName, creatingCategory]);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => category.slug === selectedSlug,
      ) ?? null,
    [categories, selectedSlug],
  );

  const setProgressItem = (
    index: number,
    updates: Partial<UploadProgress>,
  ) => {
    setProgress((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...updates }
          : item,
      ),
    );
  };

  const uploadFiles = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (files.length === 0) {
      setErrorMessage(
        "Choose at least one PNG, JPG, or WebP image.",
      );
      return;
    }

    const uploadSlug = creatingCategory
      ? slugify(categorySlug || categoryName)
      : selectedSlug;

    if (!uploadSlug) {
      setErrorMessage("Choose or name a category.");
      return;
    }

    if (
      creatingCategory &&
      (categoryName.trim().length < 2 ||
        itemLabel.trim().length < 1 ||
        filenamePrefix.trim().length < 1)
    ) {
      setErrorMessage(
        "Enter the new category name, item label, and filename prefix.",
      );
      return;
    }

    setUploading(true);
    setProgress(
      files.map((file) => ({
        filename: file.name,
        status: "waiting",
        message: "Waiting",
      })),
    );

    let completed = 0;
    let failed = 0;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      try {
        setProgressItem(index, {
          status: "converting",
          message: "Converting to WebP",
        });

        const [fullWebp, thumbnailWebp] =
          await Promise.all([
            convertToWebp(file, 5000, 0.92),
            convertToWebp(file, 700, 0.82),
          ]);

        setProgressItem(index, {
          status: "uploading",
          message: "Uploading to R2",
        });

        const formData = new FormData();
        formData.append(
          "file",
          new File([fullWebp], "wrap.webp", {
            type: "image/webp",
          }),
        );
        formData.append(
          "thumbnail",
          new File([thumbnailWebp], "thumbnail.webp", {
            type: "image/webp",
          }),
        );
        formData.append("categorySlug", uploadSlug);

        if (creatingCategory) {
          formData.append(
            "displayName",
            categoryName.trim(),
          );
          formData.append("itemLabel", itemLabel.trim());
          formData.append(
            "filenamePrefix",
            filenamePrefix.trim(),
          );
          formData.append("imageFolder", uploadSlug);
          formData.append(
            "description",
            description.trim(),
          );
          formData.append("keywords", keywords.trim());
        }

        const { data, error } =
          await supabase.functions.invoke(
            "upload-wrap",
            { body: formData },
          );

        if (error) {
          throw error;
        }

        const uploaded = data as CatalogUploadResult;

        if (!uploaded?.wrap?.id) {
          throw new Error(
            "The upload function did not return a wrap record.",
          );
        }

        completed += 1;
        setProgressItem(index, {
          status: "done",
          message: `${uploaded.wrap.display_name} published`,
        });
      } catch (error) {
        failed += 1;
        setProgressItem(index, {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Upload failed",
        });
      }
    }

    setUploading(false);
    await loadCatalog();

    if (completed > 0) {
      setSuccessMessage(
        `${completed} wrap${completed === 1 ? "" : "s"} converted to WebP, uploaded to R2, and published.`,
      );
      setFiles([]);
    }

    if (failed > 0) {
      setErrorMessage(
        `${failed} upload${failed === 1 ? "" : "s"} failed. Review the status list below.`,
      );
    }
  };

  const toggleWrap = async (wrap: RecentWrap) => {
    setErrorMessage("");

    const { error } = await supabase
      .from("catalog_wraps")
      .update({ is_active: !wrap.is_active })
      .eq("id", wrap.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadCatalog();
  };

  if (loading || !isAdmin) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Admin"
        title="Checking Catalog Access"
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
      title="Wrap Catalog Manager"
      description="Convert images to WebP, upload directly to R2, and publish them without touching GitHub."
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

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Upload Wraps</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Originals stay out of GitHub. Your browser creates the full WebP and thumbnail before upload.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreatingCategory((current) => !current);
                setErrorMessage("");
              }}
              className="rounded-full border border-red-600 px-5 py-2 text-sm font-black transition hover:bg-red-600"
            >
              {creatingCategory
                ? "Use Existing Category"
                : "Create New Category"}
            </button>
          </div>

          {!creatingCategory ? (
            <label className="mt-6 block">
              <span className="text-sm font-bold">Category</span>
              <select
                value={selectedSlug}
                onChange={(event) =>
                  setSelectedSlug(event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.display_name}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <p className="mt-2 text-xs text-white/55">
                  Next number starts after the current {selectedCategory.base_image_count} original wraps and any dashboard uploads.
                </p>
              )}
            </label>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-bold">Category name</span>
                <input
                  value={categoryName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCategoryName(value);
                    setCategorySlug(slugify(value));
                    setFilenamePrefix(prefixFromName(value));
                    setItemLabel(value);
                  }}
                  placeholder="Bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label>
                <span className="text-sm font-bold">URL slug / R2 folder</span>
                <input
                  value={categorySlug}
                  onChange={(event) =>
                    setCategorySlug(slugify(event.target.value))
                  }
                  placeholder="bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label>
                <span className="text-sm font-bold">Wrap label</span>
                <input
                  value={itemLabel}
                  onChange={(event) => setItemLabel(event.target.value)}
                  placeholder="Bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label>
                <span className="text-sm font-bold">Filename prefix</span>
                <input
                  value={filenamePrefix}
                  onChange={(event) =>
                    setFilenamePrefix(event.target.value)
                  }
                  placeholder="bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-bold">Category description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Browse playful character-inspired wrap designs."
                  className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-bold">Search keywords</span>
                <input
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="characters cartoon blue family"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>
            </div>
          )}

          <label className="mt-6 block rounded-3xl border border-dashed border-red-700 bg-red-950/15 p-6 text-center transition hover:border-red-500">
            <span className="block text-lg font-black">Choose wrap images</span>
            <span className="mt-2 block text-sm text-white/60">
              PNG, JPG, or WebP. You can select many files at once.
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
              className="mt-5 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-5 file:py-3 file:font-black file:text-white hover:file:bg-red-500"
            />
          </label>

          {files.length > 0 && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-black">
                {files.length} image{files.length === 1 ? "" : "s"} selected
              </p>
              <p className="mt-1 text-xs text-white/55">
                Upload order determines the assigned wrap numbers.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void uploadFiles()}
            disabled={uploading || files.length === 0}
            className="mt-6 w-full rounded-full bg-red-600 px-6 py-4 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Converting & Publishing…"
              : "Convert to WebP & Publish"}
          </button>

          {progress.length > 0 && (
            <div className="mt-6 space-y-2">
              {progress.map((item, index) => (
                <div
                  key={`${item.filename}-${index}`}
                  className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="truncate text-sm font-bold">
                    {item.filename}
                  </span>
                  <span
                    className={`text-xs font-black uppercase tracking-wide ${
                      item.status === "done"
                        ? "text-green-300"
                        : item.status === "error"
                          ? "text-red-300"
                          : "text-white/60"
                    }`}
                  >
                    {item.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl">
          <h2 className="text-xl font-black">Recent Dashboard Uploads</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Hide a design without deleting its R2 file or order history.
          </p>

          <div className="mt-5 max-h-[760px] space-y-4 overflow-y-auto pr-1">
            {recentWraps.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                No dashboard uploads yet.
              </div>
            ) : (
              recentWraps.map((wrap) => (
                <article
                  key={wrap.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <img
                    src={wrap.thumbnail_url}
                    alt={wrap.display_name}
                    className="aspect-[2/1] w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="font-black">{wrap.display_name}</p>
                    <p className="mt-1 text-xs text-white/55">
                      {categoryLabel(wrap)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void toggleWrap(wrap)}
                      className="mt-3 rounded-full border border-red-600 px-4 py-2 text-xs font-black transition hover:bg-red-600"
                    >
                      {wrap.is_active ? "Hide from Site" : "Publish Again"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </AuthPageShell>
  );
}
