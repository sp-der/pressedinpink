import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pressedinpink.com"),

  title: "Pressed In Pink",
  description:
    "Pressed In Pink offers custom cups, shirts, keychains, wraps, and personalized creations made with love.",

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  openGraph: {
    title: "Pressed In Pink",
    description:
      "Pressed In Pink offers custom cups, shirts, keychains, wraps, and personalized creations made with love.",
    url: "https://pressedinpink.com",
    siteName: "Pressed In Pink",
    images: [
      {
        url: "/logo.png",
        width: 600,
        height: 600,
        alt: "Pressed In Pink Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Pressed In Pink",
    description:
      "Pressed In Pink offers custom cups, shirts, keychains, wraps, and personalized creations made with love.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}