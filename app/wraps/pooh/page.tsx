
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function PoohWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.pooh}
    />
  );
}
