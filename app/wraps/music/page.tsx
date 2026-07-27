
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function MusicWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.music}
    />
  );
}
