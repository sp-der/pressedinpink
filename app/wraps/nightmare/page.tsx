
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function NightmareWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.nightmare}
    />
  );
}
