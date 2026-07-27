
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function AnimeWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.anime}
    />
  );
}
