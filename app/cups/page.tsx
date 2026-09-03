import CollectionHub from "@/components/CollectionHub";
import StorefrontFrame from "@/components/StorefrontFrame";

const cupCollections = [
  {
    title: "Snowglobe Cups",
    description:
      "Browse premade snowglobe cups filled and finished by Pressed In Pink.",
    action: "View Snowglobe Cups →",
    href: "/cups/snowglobe",
    monogram: "Snowglobe",
  },
  {
    title: "Kid's Snowglobe Cups",
    description:
      "Browse kid-sized premade snowglobe cups in fun finished designs.",
    action: "View Kid's Cups →",
    href: "/cups/kids-snowglobe",
    monogram: "Kid's",
  },
  {
    title: "Libby Cups",
    description:
      "Browse premade Libby cups ready to enjoy or give as a gift.",
    action: "View Libby Cups →",
    href: "/cups/libby",
    monogram: "Libby",
  },
  {
    title: "Paris Cups",
    description:
      "Browse premade Paris cups finished in Pressed In Pink designs.",
    action: "View Paris Cups →",
    href: "/cups/paris",
    monogram: "Paris",
  },
];

export default function PremadeCupsPage() {
  return (
    <StorefrontFrame
      backLink={{ href: "/premade", label: "Back to Premade" }}
      footerLink={{ href: "/premade", label: "Return to Premade" }}
    >
      <CollectionHub
        eyebrow="Pressed In Pink Collection"
        title="Premade Cups"
        description="Choose a cup style to browse available premade designs."
        items={cupCollections}
      />
    </StorefrontFrame>
  );
}
