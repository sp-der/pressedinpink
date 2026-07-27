
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function FourTwentyWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.fourTwenty}
    />
  );
}
