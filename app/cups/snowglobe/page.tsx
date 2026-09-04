import CupGallery from "@/components/CupGallery";
import StorefrontFrame from "@/components/StorefrontFrame";
import { getCupCategory } from "@/lib/cups";

const category = getCupCategory("snowglobe");

export default function SnowglobeCupsPage() {
  if (!category) {
    return null;
  }

  return (
    <StorefrontFrame
      backLink={{ href: "/cups", label: "Premade Cups" }}
      footerLink={{ href: "/cups", label: "Return to Premade Cups" }}
    >
      <CupGallery category={category} />
    </StorefrontFrame>
  );
}
