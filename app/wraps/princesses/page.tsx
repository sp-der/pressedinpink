import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function PrincessWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.princesses}
    />
  );
}
