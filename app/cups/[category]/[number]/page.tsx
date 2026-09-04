import { notFound } from "next/navigation";

import CupDetail from "@/components/CupDetail";
import StorefrontFrame from "@/components/StorefrontFrame";
import {
  CUP_CATEGORIES,
  categoryHasCupNumber,
  getCupCategory,
} from "@/lib/cups";

export const dynamicParams = false;

export function generateStaticParams() {
  return CUP_CATEGORIES.flatMap((category) =>
    category.itemNumbers.map((number) => ({
      category: category.slug,
      number: String(number),
    })),
  );
}

export default function CupItemPage({
  params,
}: {
  params: {
    category: string;
    number: string;
  };
}) {
  const category = getCupCategory(
    params.category,
  );
  const number = Number(params.number);

  if (
    !category ||
    !Number.isInteger(number) ||
    !categoryHasCupNumber(category, number)
  ) {
    notFound();
  }

  return (
    <StorefrontFrame
      backLink={{
        href: `/cups/${category.slug}`,
        label: category.displayName,
      }}
      footerLink={{
        href: "/cups",
        label: "Return to Premade Cups",
      }}
    >
      <CupDetail
        category={category}
        number={number}
      />
    </StorefrontFrame>
  );
}
