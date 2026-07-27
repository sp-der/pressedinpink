
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function DodgersWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.dodgers}
    />
  );
}
