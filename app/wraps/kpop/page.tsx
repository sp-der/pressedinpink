
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function KpopWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.kpop}
    />
  );
}
