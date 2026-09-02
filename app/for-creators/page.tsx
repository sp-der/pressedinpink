import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";

const creatorCollections = [
  {
    title: "UV-DTF Wraps",
    description:
      "Browse the complete UV-DTF collection by character, theme, team, artist, and style.",
    action: "Browse All Wraps →",
    href: "/wraps",
    image: "/wrap-categories/Hello Kitty.png",
    imageFit: "contain" as const,
  },
  {
    title: "Blank Cups",
    description: "Browse blank cups ready for your own wrap and finishing style.",
    action: "View Blank Cups →",
    href: "/for-creators/blank-cups",
    monogram: "Blanks",
    label: "Coming soon",
  },
  {
    title: "Glitters",
    description: "Shop glitter options for snowglobes and custom cup projects.",
    action: "View Glitters →",
    href: "/for-creators/glitters",
    monogram: "Glitter",
    label: "Coming soon",
  },
  {
    title: "Mini UV-DTF",
    description:
      "Browse smaller UV-DTF designs for accents and finishing touches.",
    action: "View Mini UV-DTF →",
    href: "/for-creators/mini-uv-dtf",
    monogram: "Mini",
    label: "Coming soon",
  },
];

export default function ForCreatorsPage() {
  return (
    <StorefrontFrame
      backLink={{ href: "/", label: "Back Home" }}
      footerLink={{ href: "/", label: "Return Home" }}
    >
      <CollectionHub
        eyebrow="Supplies for Makers"
        title="For Creators"
        description="Shop wraps, blanks, glitter, and supplies for creating your own custom pieces."
        items={creatorCollections}
      />
    </StorefrontFrame>
  );
}
