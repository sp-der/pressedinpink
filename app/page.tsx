import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";

const shoppingPaths = [
  {
    title: "Premade",
    description:
      "Browse premade cups and shirts. Custom cup orders will be added here later.",
    action: "Shop Premade →",
    href: "/premade",
    image: "/premade-shirts-category.png",
    imageFit: "cover" as const,
    label: "Finished products",
  },
  {
    title: "For Creators",
    description:
      "Find UV-DTF wraps, blank cups, glitters, and mini UV-DTF designs for your own creations.",
    action: "Shop Creator Supplies →",
    href: "/for-creators",
    image: "/wrap-categories/Hello Kitty.png",
    imageFit: "contain" as const,
    label: "Wraps & supplies",
  },
];

export default function Home() {
  return (
    <StorefrontFrame>
      <CollectionHub
        eyebrow="Pressed In Pink"
        title="What are you shopping for?"
        description="Choose premade products or supplies for creating your own custom pieces."
        items={shoppingPaths}
      />
    </StorefrontFrame>
  );
}
