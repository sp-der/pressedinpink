
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function VillainsWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.villains}
    />
  );
}
