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

type UploadProgress = {
  filename: string;
  status:
    | "waiting"
    | "converting"
    | "uploading"
    | "done"
    | "error";
  message: string;
};

type CategoryImageUploadResult = {
  category: CatalogCategoryRecord;
  categoryImageUploaded?: boolean;
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
    maxDimension / Math.max(bitmap.width, bitmap.height),
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

  const webp = await new Promise<Blob | null>(
    (resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    },
  );

  if (!webp) {
    throw new Error(
      "This browser could not convert the image to WebP.",
    );
  }

  return webp;
}

async function convertCategoryImageToWebp(
  file: File,
  sizePercent: number,
  canvasSize = 1600,
  quality = 0.9,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const fitScale = Math.min(
    canvasSize / bitmap.width,
    canvasSize / bitmap.height,
  );
  const finalScale = fitScale * (sizePercent / 100);
  const drawWidth = Math.max(
    1,
    Math.round(bitmap.width * finalScale),
  );
  const drawHeight = Math.max(
    1,
    Math.round(bitmap.height * finalScale),
  );

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    bitmap.close();
    throw new Error(
      "This browser could not prepare the category image.",
    );
  }

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    Math.round((canvasSize - drawWidth) / 2),
    Math.round((canvasSize - drawHeight) / 2),
    drawWidth,
    drawHeight,
  );
  bitmap.close();

  const webp = await new Promise<Blob | null>(
    (resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    },
  );

  if (!webp) {
    throw new Error(
      "This browser could not convert the category image to WebP.",
    );
  }

  return webp;
}

export default function AdminCatalogPage() {
  const { user, loading, isAdmin } = useAuth();

  const [categories, setCategories] = useState<
    CatalogCategoryRecord[]
  >([]);
  const [selectedSlug, setSelectedSlug] =
    useState("princesses");
  const [categoryWraps, setCategoryWraps] = useState<
    CatalogWrapRecord[]
  >([]);
  const [loadingCategoryWraps, setLoadingCategoryWraps] =
    useState(false);
  const [viewerIndex, setViewerIndex] =
    useState<number | null>(null);
  const [deletingWrapId, setDeletingWrapId] =
    useState<string | null>(null);

  const [creatingCategory, setCreatingCategory] =
    useState(false);
  const [categoryParentSlug, setCategoryParentSlug] =
    useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [filenamePrefix, setFilenamePrefix] =
    useState("");
  const [keywords, setKeywords] = useState("");

  const [categoryImageFile, setCategoryImageFile] =
    useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] =
    useState("");
  const [categoryImageScale, setCategoryImageScale] =
    useState(100);
  const [categoryImageInputKey, setCategoryImageInputKey] =
    useState(0);
  const [savingCategoryImage, setSavingCategoryImage] =
    useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<
    UploadProgress[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => category.slug === selectedSlug,
      ) ?? null,
    [categories, selectedSlug],
  );

  const selectedViewerWrap =
    viewerIndex === null
      ? null
      : categoryWraps[viewerIndex] ?? null;

  const categoryCardPreview =
    categoryImagePreview ||
    (!creatingCategory
      ? selectedCategory?.card_image_url ?? ""
      : "");

  const loadCatalog = useCallback(async () => {
    const { data, error } = await supabase
      .from("catalog_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("display_name", { ascending: true });

    if (error) {
      setErrorMessage(
        `Catalog setup is not ready: ${error.message}`,
      );
      return;
    }

    const nextCategories =
      (data ?? []) as CatalogCategoryRecord[];

    setCategories(nextCategories);
    setSelectedSlug((current) =>
      nextCategories.some(
        (category) => category.slug === current,
      )
        ? current
        : nextCategories[0]?.slug ?? current,
    );
  }, []);

  const loadCategoryWraps = useCallback(
    async (categoryId: string | null | undefined) => {
      if (!categoryId) {
        setCategoryWraps([]);
        return;
      }

      setLoadingCategoryWraps(true);

      const { data, error } = await supabase
        .from("catalog_wraps")
        .select("*")
        .eq("category_id", categoryId)
        .order("image_number", { ascending: true });

      if (error) {
        setCategoryWraps([]);
        setErrorMessage(
          `Could not load category wraps: ${error.message}`,
        );
      } else {
        setCategoryWraps(
          (data ?? []) as CatalogWrapRecord[],
        );
      }

      setLoadingCategoryWraps(false);
    },
    [],
  );

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
    setViewerIndex(null);

    if (creatingCategory) {
      setCategoryWraps([]);
      return;
    }

    void loadCategoryWraps(selectedCategory?.id);
  }, [
    selectedCategory?.id,
    creatingCategory,
    loadCategoryWraps,
  ]);

  useEffect(() => {
    if (!categoryImageFile) {
      setCategoryImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(
      categoryImageFile,
    );
    setCategoryImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [categoryImageFile]);

  const appendNewCategoryFields = (
    formData: FormData,
  ) => {
    if (!creatingCategory) {
      return;
    }

    formData.append(
      "displayName",
      categoryName.trim(),
    );
    formData.append("itemLabel", itemLabel.trim());
    formData.append(
      "filenamePrefix",
      filenamePrefix.trim(),
    );
    formData.append(
      "imageFolder",
      slugify(categorySlug || categoryName),
    );
    formData.append("keywords", keywords.trim());
    formData.append("parentSlug", categoryParentSlug);
  };

  const validateNewCategory = (): string | null => {
    if (!creatingCategory) {
      return null;
    }

    if (
      categoryName.trim().length < 2 ||
      itemLabel.trim().length < 1 ||
      filenamePrefix.trim().length < 1
    ) {
      return "Enter the new category name, wrap label, and filename prefix.";
    }

    return null;
  };

  const uploadCategoryImage = async (
    uploadSlug: string,
  ): Promise<CatalogCategoryRecord> => {
    if (!categoryImageFile) {
      throw new Error("Choose a category image first.");
    }

    const categoryWebp = await convertCategoryImageToWebp(
      categoryImageFile,
      categoryImageScale,
      1600,
      0.9,
    );
    const formData = new FormData();

    formData.append("action", "category-image");
    formData.append("categorySlug", uploadSlug);
    formData.append(
      "categoryImage",
      new File(
        [categoryWebp],
        "category-card.webp",
        { type: "image/webp" },
      ),
    );
    appendNewCategoryFields(formData);

    const { data, error } =
      await supabase.functions.invoke(
        "upload-wrap",
        { body: formData },
      );

    if (error) {
      throw error;
    }

    const uploaded =
      data as CategoryImageUploadResult;

    if (!uploaded?.category?.id) {
      throw new Error(
        "The upload function did not return a category record.",
      );
    }

    return uploaded.category;
  };

  const saveCategoryImageOnly = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!categoryImageFile) {
      setErrorMessage(
        "Choose a PNG, JPG, or WebP category image.",
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

    const validation = validateNewCategory();

    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setSavingCategoryImage(true);

    try {
      const uploadedCategory =
        await uploadCategoryImage(uploadSlug);

      setSelectedSlug(uploadedCategory.slug);
      setCreatingCategory(false);
      setCategoryParentSlug("");
      setCategoryImageFile(null);
      setCategoryImageScale(100);
      setCategoryImageInputKey((current) => current + 1);
      await loadCatalog();
      await loadCategoryWraps(uploadedCategory.id);
      setSuccessMessage(
        `${uploadedCategory.display_name} category image saved to R2.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The category image could not be saved.",
      );
    } finally {
      setSavingCategoryImage(false);
    }
  };

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
      setErrorMessage("Choose at least one wrap image.");
      return;
    }

    const uploadSlug = creatingCategory
      ? slugify(categorySlug || categoryName)
      : selectedSlug;

    if (!uploadSlug) {
      setErrorMessage("Choose or name a category.");
      return;
    }

    const validation = validateNewCategory();

    if (validation) {
      setErrorMessage(validation);
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
    let publishedCategory:
      | CatalogCategoryRecord
      | null = selectedCategory;

    if (categoryImageFile) {
      setSavingCategoryImage(true);

      try {
        publishedCategory =
          await uploadCategoryImage(uploadSlug);
        setCategoryImageFile(null);
        setCategoryImageScale(100);
        setCategoryImageInputKey((current) => current + 1);
      } catch (error) {
        setUploading(false);
        setSavingCategoryImage(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The category image could not be saved.",
        );
        return;
      } finally {
        setSavingCategoryImage(false);
      }
    }

    for (
      let index = 0;
      index < files.length;
      index += 1
    ) {
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
          new File(
            [thumbnailWebp],
            "thumbnail.webp",
            { type: "image/webp" },
          ),
        );
        formData.append("categorySlug", uploadSlug);
        appendNewCategoryFields(formData);

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

        publishedCategory = uploaded.category;
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

    if (publishedCategory?.id && completed > 0) {
      setCreatingCategory(false);
      setCategoryParentSlug("");
      setSelectedSlug(publishedCategory.slug);
      await loadCatalog();
      await loadCategoryWraps(publishedCategory.id);
      setFiles([]);
    }

    if (completed > 0) {
      setSuccessMessage(
        `${completed} wrap${completed === 1 ? "" : "s"} converted, uploaded to R2, and published.`,
      );
    }

    if (failed > 0) {
      setErrorMessage(
        `${failed} upload${failed === 1 ? "" : "s"} failed. Review the status list.`,
      );
    }
  };

  const deleteWrap = async (
    wrap: CatalogWrapRecord,
  ) => {
    const confirmed = window.confirm(
      `Delete ${wrap.display_name}? This permanently removes the catalog record and its R2 files.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setDeletingWrapId(wrap.id);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "delete-wrap",
          { body: { wrapId: wrap.id } },
        );

      if (error) {
        throw error;
      }

      const result = data as {
        deleted?: boolean;
        r2CleanupWarning?: boolean;
      };

      if (!result?.deleted) {
        throw new Error(
          "The delete function did not confirm deletion.",
        );
      }

      setViewerIndex(null);
      await loadCategoryWraps(selectedCategory?.id);

      setSuccessMessage(
        result.r2CleanupWarning
          ? `${wrap.display_name} was removed from the catalog. R2 cleanup reported a warning.`
          : `${wrap.display_name} was permanently deleted.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The wrap could not be deleted.",
      );
    } finally {
      setDeletingWrapId(null);
    }
  };

  const showPreviousWrap = () => {
    setViewerIndex((current) => {
      if (
        current === null ||
        categoryWraps.length === 0
      ) {
        return null;
      }

      return current === 0
        ? categoryWraps.length - 1
        : current - 1;
    });
  };

  const showNextWrap = () => {
    setViewerIndex((current) => {
      if (
        current === null ||
        categoryWraps.length === 0
      ) {
        return null;
      }

      return current === categoryWraps.length - 1
        ? 0
        : current + 1;
    });
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
      description="Upload, preview, manage, and delete wraps by category."
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

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">
                Upload Wraps
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Originals stay out of GitHub. Your browser creates the full WebP and thumbnail before upload.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreatingCategory((current) => !current);
                setCategoryParentSlug("");
                setCategoryImageFile(null);
                setCategoryImageScale(100);
                setCategoryImageInputKey((current) =>
                  current + 1,
                );
                setViewerIndex(null);
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
              <span className="text-sm font-bold">
                Category
              </span>
              <select
                value={selectedSlug}
                onChange={(event) => {
                  setSelectedSlug(event.target.value);
                  setCategoryImageFile(null);
                  setCategoryImageScale(100);
                  setCategoryImageInputKey((current) =>
                    current + 1,
                  );
                  setViewerIndex(null);
                }}
                className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              >
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.slug}
                  >
                    {category.parent_slug === "sports"
                      ? `Sports • ${category.display_name}`
                      : category.display_name}
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
              <label className="sm:col-span-2">
                <span className="text-sm font-bold">
                  Where should this category appear?
                </span>
                <select
                  value={categoryParentSlug}
                  onChange={(event) =>
                    setCategoryParentSlug(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                >
                  <option value="">
                    Main Wrap Categories
                  </option>
                  <option value="sports">
                    Sports Team Categories
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-bold">
                  Category name
                </span>
                <input
                  value={categoryName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCategoryName(value);
                    setCategorySlug(slugify(value));
                    setFilenamePrefix(
                      prefixFromName(value),
                    );
                    setItemLabel(value);
                  }}
                  placeholder="Bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label>
                <span className="text-sm font-bold">
                  URL slug / R2 folder
                </span>
                <input
                  value={categorySlug}
                  onChange={(event) =>
                    setCategorySlug(
                      slugify(event.target.value),
                    )
                  }
                  placeholder="bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label>
                <span className="text-sm font-bold">
                  Wrap label
                </span>
                <input
                  value={itemLabel}
                  onChange={(event) =>
                    setItemLabel(event.target.value)
                  }
                  placeholder="Bluey"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>

              <label>
                <span className="text-sm font-bold">
                  Filename prefix
                </span>
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
                <span className="text-sm font-bold">
                  Search keywords
                </span>
                <input
                  value={keywords}
                  onChange={(event) =>
                    setKeywords(event.target.value)
                  }
                  placeholder="characters cartoon blue family"
                  className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </label>
            </div>
          )}

          <section className="mt-6 rounded-3xl border border-red-900 bg-red-950/10 p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-red-800 bg-black">
                {categoryCardPreview ? (
                  <img
                    src={categoryCardPreview}
                    alt="Category card preview"
                    className="h-full w-full object-contain transition-transform duration-200"
                    style={{
                      transform: categoryImageFile
                        ? `scale(${categoryImageScale / 100})`
                        : undefined,
                    }}
                  />
                ) : (
                  <span className="px-4 text-center text-sm font-bold text-white/45">
                    Category image preview
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black">
                  Category Card Image
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Upload or replace the artwork shown on the category card.
                </p>

                <input
                  key={categoryImageInputKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading || savingCategoryImage}
                  onChange={(event) => {
                    setCategoryImageFile(
                      event.target.files?.[0] ?? null,
                    );
                    setCategoryImageScale(100);
                  }}
                  className="mt-4 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-5 file:py-3 file:font-black file:text-white hover:file:bg-red-500"
                />

                {categoryImageFile && (
                  <div className="mt-4 rounded-2xl border border-red-900 bg-black/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-black">
                        Category image size
                      </span>
                      <span className="rounded-full border border-red-700 px-3 py-1 text-xs font-black text-red-300">
                        {categoryImageScale}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={categoryImageScale}
                      onChange={(event) =>
                        setCategoryImageScale(
                          Number(event.target.value),
                        )
                      }
                      className="mt-4 w-full accent-red-600"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void saveCategoryImageOnly()
                  }
                  disabled={
                    !categoryImageFile ||
                    uploading ||
                    savingCategoryImage
                  }
                  className="mt-4 rounded-full border border-red-600 px-5 py-3 text-sm font-black transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCategoryImage
                    ? "Saving Category Image…"
                    : creatingCategory
                      ? "Create Category & Save Image"
                      : "Upload / Replace Category Image"}
                </button>
              </div>
            </div>
          </section>

          <label className="mt-6 block rounded-3xl border border-dashed border-red-700 bg-red-950/15 p-6 text-center transition hover:border-red-500">
            <span className="block text-lg font-black">
              Choose wrap images
            </span>
            <span className="mt-2 block text-sm text-white/60">
              PNG, JPG, or WebP. Select many files at once.
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(event) =>
                setFiles(
                  Array.from(event.target.files ?? []),
                )
              }
              className="mt-5 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-5 file:py-3 file:font-black file:text-white hover:file:bg-red-500"
            />
          </label>

          <button
            type="button"
            onClick={() => void uploadFiles()}
            disabled={uploading || files.length === 0}
            className="mt-6 w-full rounded-full bg-red-600 px-6 py-4 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Converting & Publishing…"
              : `Convert to WebP & Publish${files.length > 0 ? ` (${files.length})` : ""}`}
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">
                {selectedCategory
                  ? `${selectedCategory.display_name} Wraps`
                  : "Current Category Wraps"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                The manager follows the category selected on the left. Click a wrap to inspect the full rotated design or permanently delete it.
              </p>
            </div>

            {!creatingCategory && selectedCategory && (
              <span className="shrink-0 rounded-full border border-red-800 px-3 py-1 text-xs font-black text-red-200">
                {categoryWraps.length}
              </span>
            )}
          </div>

          <div className="mt-5 max-h-[760px] space-y-4 overflow-y-auto pr-1">
            {creatingCategory ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Finish creating the category to manage its wraps.
              </div>
            ) : loadingCategoryWraps ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Loading category wraps…
              </div>
            ) : categoryWraps.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                No dashboard-managed wraps are in this category yet.
              </div>
            ) : (
              categoryWraps.map((wrap, index) => (
                <article
                  key={wrap.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => setViewerIndex(index)}
                    aria-label={`Open ${wrap.display_name}`}
                    className="group block w-full"
                  >
                    <div className="relative aspect-[2/1] w-full overflow-hidden bg-white">
                      <img
                        src={wrap.thumbnail_url}
                        alt={wrap.display_name}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            wrap.full_image_url;
                        }}
                        className="absolute left-1/2 top-1/2 h-[204%] w-[52%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  </button>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {wrap.display_name}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          Wrap #{wrap.image_number}
                          {!wrap.is_active
                            ? " • Hidden"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewerIndex(index)}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-black transition hover:bg-white/10"
                      >
                        View Full Wrap
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void deleteWrap(wrap)
                        }
                        disabled={
                          deletingWrapId === wrap.id
                        }
                        className="rounded-full border border-red-600 px-4 py-2 text-xs font-black text-red-200 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        {deletingWrapId === wrap.id
                          ? "Deleting…"
                          : "Delete Wrap"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      {selectedViewerWrap && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedViewerWrap.display_name} viewer`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
          onClick={() => setViewerIndex(null)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setViewerIndex(null);
            }}
            aria-label="Close viewer"
            className="absolute right-4 top-4 z-[90] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-3xl font-bold text-white transition hover:bg-red-600"
          >
            ×
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPreviousWrap();
            }}
            aria-label="Previous wrap"
            className="absolute left-2 z-[90] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold text-white transition hover:bg-red-600 sm:left-6"
          >
            ‹
          </button>

          <div
            className="w-full max-w-6xl rounded-3xl border border-red-900 bg-black/95 p-3 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-white">
              <img
                src={selectedViewerWrap.full_image_url}
                alt={`${selectedViewerWrap.display_name} full wrap`}
                draggable={false}
                className="absolute left-1/2 top-1/2 h-[200%] w-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black">
                  {selectedViewerWrap.display_name}
                </p>
                <p className="mt-1 text-xs text-white/55">
                  Wrap #{selectedViewerWrap.image_number}
                  {" • "}
                  {(viewerIndex ?? 0) + 1} / {categoryWraps.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void deleteWrap(selectedViewerWrap)
                }
                disabled={
                  deletingWrapId === selectedViewerWrap.id
                }
                className="rounded-full border border-red-600 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
              >
                {deletingWrapId === selectedViewerWrap.id
                  ? "Deleting…"
                  : "Delete Wrap"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNextWrap();
            }}
            aria-label="Next wrap"
            className="absolute right-2 z-[90] flex h-12 w-12 items-center justify-center rounded-full border border-red-600 bg-black/90 text-4xl font-bold text-white transition hover:bg-red-600 sm:right-6"
          >
            ›
          </button>
        </div>
      )}
    </AuthPageShell>
  );
}
