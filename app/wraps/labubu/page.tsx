
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function LabubuWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.labubu}
    />
  );
}
