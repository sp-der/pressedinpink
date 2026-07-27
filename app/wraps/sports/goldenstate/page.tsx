
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function GoldenStateWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.goldenState}
    />
  );
}
