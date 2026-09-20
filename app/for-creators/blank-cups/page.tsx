import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";
import { BLANK_CUP_CATEGORIES } from "@/lib/blankCups";

const blankCupCollections = BLANK_CUP_CATEGORIES.map(
  (category) => ({
    title: category.displayName,
    description: category.description,
    action: `View ${category.displayName} →`,
    href: `/for-creators/blank-cups/${category.slug}`,
    monogram: category.monogram,
  }),
);

export default function BlankCupsPage() {
  return (
    <StorefrontFrame
      backLink={{ href: "/for-creators", label: "For Creators" }}
      footerLink={{ href: "/for-creators", label: "Return to For Creators" }}
    >
      <CollectionHub
        eyebrow="For Creators"
        title="Blank Cups"
        description="Choose a cup style, select the quantity you need, and add it to your request cart."
        items={blankCupCollections}
      />
    </StorefrontFrame>
  );
}
