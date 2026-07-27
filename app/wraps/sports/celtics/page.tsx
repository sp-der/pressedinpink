
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function CelticsWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.celtics}
    />
  );
}
