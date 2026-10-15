import BrandIntro from "@/components/BrandIntro";
import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";

const shoppingPaths = [
  {
    title: "For Custom & Premade",
    description:
      "Order custom cups or shop premade cups, shirts, totes, and more.",
    action: "Shop Custom & Premade →",
    href: "/premade",
    monogram: "For Custom & Premade",
    label: "Finished products",
  },
  {
    title: "For Creators",
    description:
      "Find UV-DTF wraps, blank cups, glitters, and mini UV-DTF designs for your own creations.",
    action: "Shop Creator Supplies →",
    href: "/for-creators",
    label: "Wraps & supplies",
  },
];

export default function Home() {
  return (
    <>
      <BrandIntro />
      <StorefrontFrame>
      <CollectionHub
        eyebrow="Rialto, CA"
        title="Made for Creators Built for Custom & Where Custom Meets Creativity"
        description="Here you can order a custom cup from Pressed in Pink or browse wraps, blanks, bundles, and supplies to create your own."
        heroAction={{
          label: "Message to Order",
          href: "https://www.instagram.com/pressed_in_pink/",
        }}
        layout="circles"
        items={shoppingPaths}
      />
      </StorefrontFrame>
    </>
  );
}
