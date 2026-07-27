
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function BullsWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.bulls}
    />
  );
}
