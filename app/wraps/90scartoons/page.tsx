
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function NinetiesCartoonsWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.ninetiesCartoons}
    />
  );
}
