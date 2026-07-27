
import WrapGallery from "@/components/WrapGallery";
import { wrapCategories } from "@/data/wrapCategories";

export default function HelloKittyAndFriendsWrapsPage() {
  return (
    <WrapGallery
      category={wrapCategories.helloKitty}
    />
  );
}
