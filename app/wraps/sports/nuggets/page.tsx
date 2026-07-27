
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function NuggetsWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.nuggets}
    />
  );
}
