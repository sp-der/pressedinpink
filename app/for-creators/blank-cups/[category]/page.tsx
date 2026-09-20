import { notFound } from "next/navigation";

import BlankCupGallery from "@/components/BlankCupGallery";
import StorefrontFrame from "@/components/StorefrontFrame";
import {
  BLANK_CUP_CATEGORIES,
  getBlankCupCategory,
} from "@/lib/blankCups";

export const dynamicParams = false;

export function generateStaticParams() {
  return BLANK_CUP_CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export default function BlankCupCategoryPage({
  params,
}: {
  params: {
    category: string;
  };
}) {
  const category = getBlankCupCategory(params.category);

  if (!category) {
    notFound();
  }

  return (
    <StorefrontFrame
      backLink={{
        href: "/for-creators/blank-cups",
        label: "Blank Cups",
      }}
      footerLink={{
        href: "/for-creators/blank-cups",
        label: "Return to Blank Cups",
      }}
    >
      <BlankCupGallery category={category} />
    </StorefrontFrame>
  );
}
