import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";

const premadeCollections = [
  {
    title: "Premade Cups",
    description:
      "Shop Snowglobe Cups, Kid's Snowglobe Cups, Libby Cups, and Paris Cups.",
    action: "View Premade Cups →",
    href: "/cups",
    monogram: "Cups",
  },
  {
    title: "Premade Shirts",
    description:
      "Shop available shirts by size, with made-to-order sizing available when needed.",
    action: "View Premade Shirts →",
    href: "/shirts/premade",
    monogram: "Shirts",
  },
  {
    title: "Custom Cup Orders",
    description:
      "Choose your cup, wrap, and lid to create your own custom piece.",
    action: "Build Your Cup →",
    href: "/custom-cup",
    monogram: "Custom",
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
        title="Custom & Premade"
        description="Build a custom cup or shop premade cups and shirts."
        items={premadeCollections}
      />
    </StorefrontFrame>
  );
}
