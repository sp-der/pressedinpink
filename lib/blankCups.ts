import type { WrapProduct } from "@/types/cart";

export type BlankCupCategorySlug =
  | "acrylic"
  | "glass"
  | "metal"
  | "mugs"
  | "screw-top"
  | "snowglobe"
  | "lids";

export type BlankCupCategoryConfig = {
  slug: BlankCupCategorySlug;
  displayName: string;
  itemLabel: string;
  monogram: string;
  description: string;
  sourceFilenames: string[];
};

export const BLANK_CUP_CATEGORIES: BlankCupCategoryConfig[] = [
  {
    slug: "acrylic",
    displayName: "Acrylic Cups",
    itemLabel: "Acrylic Cup",
    monogram: "Acrylic",
    description:
      "Browse blank acrylic cups ready for your own wraps, decals, and finishing style.",
    sourceFilenames: [
      "IMG_8962.JPG",
      "IMG_8973.JPG",
      "IMG_9006.JPG",
      "IMG_9007.JPG",
    ],
  },
  {
    slug: "glass",
    displayName: "Glass Cups",
    itemLabel: "Glass Cup",
    monogram: "Glass",
    description:
      "Browse blank glass cup styles and request the quantity you need for your projects.",
    sourceFilenames: [
      "IMG_8956.JPG",
      "IMG_8957.JPG",
      "IMG_8958.JPG",
      "IMG_8959.JPG",
      "IMG_8960.JPG",
      "IMG_8978.JPG",
      "IMG_8979.JPG",
      "IMG_8980.JPG",
      "IMG_8982.JPG",
      "IMG_8983.JPG",
      "IMG_8984.JPG",
      "IMG_8985.JPG",
      "IMG_8986.JPG",
      "IMG_8987.JPG",
      "IMG_8988.JPG",
      "IMG_8989.JPG",
      "IMG_8998.JPG",
      "IMG_9008.JPG",
      "IMG_9009.JPG",
    ],
  },
  {
    slug: "metal",
    displayName: "Metal Cups",
    itemLabel: "Metal Cup",
    monogram: "Metal",
    description:
      "Browse blank metal cup styles ready to customize in the quantity you need.",
    sourceFilenames: [
      "IMG_8967.JPG",
      "IMG_8968.JPG",
      "IMG_8969.JPG",
      "IMG_8970.JPG",
      "IMG_8971.JPG",
      "IMG_8972.JPG",
      "IMG_8997.JPG",
      "IMG_9001.JPG",
      "IMG_9002.JPG",
      "IMG_9003.JPG",
      "IMG_9004.JPG",
      "IMG_9005.JPG",
    ],
  },
  {
    slug: "mugs",
    displayName: "Mugs",
    itemLabel: "Mug",
    monogram: "Mugs",
    description:
      "Browse blank mugs for personalized designs and custom projects.",
    sourceFilenames: [
      "IMG_8961.JPG",
      "IMG_8963.JPG",
      "IMG_8974.JPG",
      "IMG_8975.JPG",
      "IMG_8976.JPG",
      "IMG_8977.JPG",
    ],
  },
  {
    slug: "screw-top",
    displayName: "Screw Top Cups",
    itemLabel: "Screw Top Cup",
    monogram: "Screw Top",
    description:
      "Browse blank screw top cup styles and select the quantity you want to request.",
    sourceFilenames: [
      "IMG_8981.JPG",
      "IMG_8996.JPG",
    ],
  },
  {
    slug: "snowglobe",
    displayName: "Snowglobe Cups",
    itemLabel: "Snowglobe Cup",
    monogram: "Snowglobe",
    description:
      "Browse blank snowglobe cups ready for glitter, wraps, and your own finishing touches.",
    sourceFilenames: [
      "IMG_8964.JPG",
      "IMG_8990.JPG",
      "IMG_8991.JPG",
      "IMG_8992.JPG",
      "IMG_8993.JPG",
      "IMG_8994.JPG",
      "IMG_8995.JPG",
      "IMG_8999.JPG",
      "IMG_9010.JPG",
    ],
  },
  {
    slug: "lids",
    displayName: "Lids",
    itemLabel: "Lid",
    monogram: "Lids",
    description:
      "Browse available lid colors and request the quantity you need for your cups.",
    sourceFilenames: [
      "Baby Blue.png",
      "Black].png",
      "Clear.png",
      "Cream.png",
      "Light Pink.png",
      "Mint.png",
      "Pink.png",
      "Purple.png",
      "Red.png",
    ],
  },
];

export function getBlankCupCategory(
  slug: string,
): BlankCupCategoryConfig | undefined {
  return BLANK_CUP_CATEGORIES.find(
    (category) => category.slug === slug,
  );
}

export function getBlankCupImageUrl(
  category: BlankCupCategoryConfig,
  number: number,
): string {
  return `/blank-cups/${category.slug}/${number}.webp`;
}

export function getBlankCupProduct(
  category: BlankCupCategoryConfig,
  number: number,
): WrapProduct {
  const sourceFilename =
    category.sourceFilenames[number - 1] ??
    `${category.itemLabel} ${number}`;
  const imageUrl = getBlankCupImageUrl(
    category,
    number,
  );

  return {
    id: `blank-cup:${category.slug}:${number}`,
    displayName: `${category.itemLabel} ${number}`,
    categorySlug: `blank-${category.slug}`,
    categoryName: category.displayName,
    imageNumber: number,
    sourceFilename,
    thumbnailUrl: imageUrl,
    fullImageUrl: imageUrl,
    productType: "cup",
    mediaType: "image",
    isOneOfOne: false,
    detailHref: `/for-creators/blank-cups/${category.slug}/${number}`,
  };
}

export function getBlankCupProducts(
  category: BlankCupCategoryConfig,
): WrapProduct[] {
  return category.sourceFilenames.map((_, index) =>
    getBlankCupProduct(category, index + 1),
  );
}

export function categoryHasBlankCupNumber(
  category: BlankCupCategoryConfig,
  number: number,
): boolean {
  return (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= category.sourceFilenames.length
  );
}

// Colored-lid compatibility confirmed by the owner; match original filenames,
// not gallery positions, so reordering photos cannot change eligibility.
const COLORED_LID_CUPS = new Set([
  "IMG_8962", "IMG_9006", "IMG_9007",
  "IMG_8956", "IMG_8957", "IMG_8958", "IMG_8959", "IMG_8960",
  "IMG_8978", "IMG_8979", "IMG_8980", "IMG_8989", "IMG_8998",
  "IMG_9008", "IMG_9009", "IMG_8964", "IMG_9010",
]);

export function blankCupHasColoredLids(product: WrapProduct): boolean {
  const source = product.sourceFilename.replace(/\.[^.]+$/, "").toUpperCase();
  return product.categorySlug === "blank-metal"
    ? source !== "IMG_8967"
    : COLORED_LID_CUPS.has(source);
}

export const CUSTOM_CUP_CATEGORIES = BLANK_CUP_CATEGORIES.filter(c => c.slug !== "lids");
export const CUSTOM_CUPS = CUSTOM_CUP_CATEGORIES.flatMap(getBlankCupProducts);
export const CUSTOM_LIDS = getBlankCupProducts(getBlankCupCategory("lids")!).map(product => ({
  ...product,
  displayName: product.sourceFilename.replace(/\.[^.]+$/, "").replace(/\]/g, ""),
}));
