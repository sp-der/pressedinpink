import type { WrapProduct } from "@/types/cart";

export type CupCategorySlug =
  | "snowglobe"
  | "libby"
  | "paris";

export type CupCategoryConfig = {
  slug: CupCategorySlug;
  databaseSlug: string;
  displayName: string;
  itemLabel: string;
  r2Folder: string;
  filenamePrefix: string;
  count: number;
  description: string;
};

const R2_VIDEO_BASE_URL =
  "https://images.pressedinpink.com/videos";

export const CUP_CATEGORIES: CupCategoryConfig[] = [
  {
    slug: "snowglobe",
    databaseSlug: "cup-snowglobe",
    displayName: "Snowglobe Cups",
    itemLabel: "Snowglobe Cup",
    r2Folder: "snowglobecups",
    filenamePrefix: "Snowglobe",
    count: 18,
    description:
      "Premade one-of-one Snowglobe Cups. Each cup shown is the exact finished cup available to request.",
  },
  {
    slug: "libby",
    databaseSlug: "cup-libby",
    displayName: "Libby Cups",
    itemLabel: "Libby Cup",
    r2Folder: "libbycups",
    filenamePrefix: "Libby",
    count: 34,
    description:
      "Premade one-of-one Libby Cups. Each cup shown is the exact finished cup available to request.",
  },
  {
    slug: "paris",
    databaseSlug: "cup-paris",
    displayName: "Paris Cups",
    itemLabel: "Paris Cup",
    r2Folder: "pariscups",
    filenamePrefix: "Paris",
    count: 6,
    description:
      "Premade one-of-one Paris Cups. Each cup shown is the exact finished cup available to request.",
  },
];

export function getCupCategory(
  slug: string,
): CupCategoryConfig | undefined {
  return CUP_CATEGORIES.find(
    (category) => category.slug === slug,
  );
}

export function getCupVideoUrl(
  category: CupCategoryConfig,
  number: number,
): string {
  const filename =
    `${category.filenamePrefix} (${number}).mp4`;

  return `${R2_VIDEO_BASE_URL}/${category.r2Folder}/${encodeURIComponent(
    filename,
  )}`;
}

export function getCupProduct(
  category: CupCategoryConfig,
  number: number,
): WrapProduct {
  const videoUrl = getCupVideoUrl(
    category,
    number,
  );

  return {
    id: `cup:${category.slug}:${number}`,
    displayName: `${category.itemLabel} ${number}`,
    categorySlug: category.databaseSlug,
    categoryName: category.displayName,
    imageNumber: number,
    sourceFilename: `${category.filenamePrefix} (${number}).mp4`,
    thumbnailUrl: videoUrl,
    fullImageUrl: videoUrl,
    productType: "cup",
    mediaType: "video",
    isOneOfOne: true,
    detailHref: `/cups/${category.slug}/${number}`,
  };
}

export function getCupProducts(
  category: CupCategoryConfig,
): WrapProduct[] {
  return Array.from(
    { length: category.count },
    (_, index) =>
      getCupProduct(category, index + 1),
  );
}

export type CupDescriptionMap = Record<
  string,
  string
>;

export function parseCupDescriptions(
  value: string | null | undefined,
): CupDescriptionMap {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as {
      items?: unknown;
    };

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.items ||
      typeof parsed.items !== "object"
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(
        parsed.items as Record<string, unknown>,
      )
        .filter(
          ([, description]) =>
            typeof description === "string",
        )
        .map(([key, description]) => [
          key,
          (description as string).trim(),
        ]),
    );
  } catch {
    return {};
  }
}

export function serializeCupDescriptions(
  descriptions: CupDescriptionMap,
): string {
  return JSON.stringify({
    type: "pnp-cup-descriptions-v1",
    items: descriptions,
  });
}
