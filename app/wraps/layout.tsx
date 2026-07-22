import type { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://pressedinpink.com"),
  title: {
    default: "UV-DTF Wraps | Pressed In Pink",
    template: "%s | Pressed In Pink",
  },

  description:
    "Browse UV-DTF wrap designs from Pressed In Pink, including cartoons, anime, sports, music, villains, and more.",

  openGraph: {
    type: "website",
    siteName: "Pressed In Pink",
    title: "UV-DTF Wraps | Pressed In Pink",
    description:
      "Browse UV-DTF wrap designs from Pressed In Pink.",
    images: [
      {
        url: "/pnp-social-preview.png?v=4",
        width: 600,
        height: 600,
        alt: "Pressed In Pink",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "UV-DTF Wraps | Pressed In Pink",
    description:
      "Browse UV-DTF wrap designs from Pressed In Pink.",
    images: ["/pnp-social-preview.png?v=4"],
  },
};

export default function WrapsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}