import { notFound } from "next/navigation";

import BlankCupDetail from "@/components/BlankCupDetail";
import StorefrontFrame from "@/components/StorefrontFrame";
import {
  BLANK_CUP_CATEGORIES,
  categoryHasBlankCupNumber,
  getBlankCupCategory,
} from "@/lib/blankCups";

export const dynamicParams = false;

export function generateStaticParams() {
  return BLANK_CUP_CATEGORIES.flatMap((category) =>
    category.sourceFilenames.map((_, index) => ({
      category: category.slug,
      number: String(index + 1),
    })),
  );
}

export default function BlankCupItemPage({
  params,
}: {
  params: {
    category: string;
    number: string;
  };
}) {
  const category = getBlankCupCategory(params.category);
  const number = Number(params.number);

  if (
    !category ||
    !categoryHasBlankCupNumber(category, number)
  ) {
    notFound();
  }

  return (
    <StorefrontFrame
      backLink={{
        href: `/for-creators/blank-cups/${category.slug}`,
        label: category.displayName,
      }}
      footerLink={{
        href: "/for-creators/blank-cups",
        label: "Return to Blank Cups",
      }}
    >
      <BlankCupDetail category={category} number={number} />
    </StorefrontFrame>
  );
}
