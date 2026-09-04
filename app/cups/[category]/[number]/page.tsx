import { notFound } from "next/navigation";

import CupDetail from "@/components/CupDetail";
import StorefrontFrame from "@/components/StorefrontFrame";
import {
  CUP_CATEGORIES,
  getCupCategory,
} from "@/lib/cups";

export function generateStaticParams() {
  return CUP_CATEGORIES.flatMap((category) =>
    Array.from(
      { length: category.count },
      (_, index) => ({
        category: category.slug,
        number: String(index + 1),
      }),
    ),
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
    number < 1 ||
    number > category.count
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
