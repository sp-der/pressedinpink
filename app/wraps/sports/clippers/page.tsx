
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function ClippersWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.clippers}
    />
  );
}
