
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function LakersWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.lakers}
    />
  );
}
