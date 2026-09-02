import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";

const premadeCollections = [
  {
    title: "Premade Cups",
    description: "Browse finished cup designs from Pressed In Pink.",
    action: "View Premade Cups →",
    href: "/cups",
    monogram: "Cups",
    label: "Coming soon",
  },
  {
    title: "Premade Shirts",
    description:
      "Shop available shirts by size, with made-to-order sizing available when needed.",
    action: "View Premade Shirts →",
    href: "/shirts/premade",
    image: "/premade-shirts-category.png",
    imageFit: "cover" as const,
  },
  {
    title: "Custom Cup Orders",
    description:
      "A guided custom cup ordering option will be added in a later update.",
    action: "Coming Soon",
    monogram: "Custom",
    label: "Coming soon",
  },
];

export default function PremadePage() {
  return (
    <StorefrontFrame
      backLink={{ href: "/", label: "Back Home" }}
      footerLink={{ href: "/", label: "Return Home" }}
    >
      <CollectionHub
        eyebrow="Shop Finished Pieces"
        title="Premade"
        description="Choose from premade cups and shirts, with custom cup ordering coming later."
        items={premadeCollections}
      />
    </StorefrontFrame>
  );
}
