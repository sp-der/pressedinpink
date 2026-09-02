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
        eyebrow="Rialto, CA"
        title="Made for Creators Built for Custom & Where Custom Meets Creativity"
        description="Here you can order a custom cup from Pressed in Pink or browse wraps, blanks, bundles, and supplies to create your own."
        heroAction={{
          label: "Message to Order",
          href: "https://www.instagram.com/pressed_in_pink/",
        }}
        items={shoppingPaths}
      />
    </StorefrontFrame>
  );
}
