import type { Metadata } from "next";

import AccountButton from "@/components/AccountButton";
import { AuthProvider } from "@/components/AuthProvider";
import CartButton from "@/components/CartButton";
import { CartProvider } from "@/components/CartProvider";

import "./globals.css";

const socialImage =
  "https://pressedinpink.com/pnp-social-preview-v2.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://pressedinpink.com"),
  title: "Pressed In Pink",
  description:
    "Pressed In Pink offers custom cups, shirts, keychains, wraps, and personalized creations made with love.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon-v2.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/favicon-v2.png",
    apple: "/favicon-v2.png",
  },
  openGraph: {
    type: "website",
    url: "https://pressedinpink.com",
    siteName: "Pressed In Pink",
    title: "Pressed In Pink",
    description:
      "Custom cups, shirts, keychains, UV-DTF wraps, and personalized creations made with love.",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "Pressed In Pink logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pressed In Pink",
    description:
      "Custom cups, shirts, keychains, UV-DTF wraps, and personalized creations made with love.",
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <AccountButton />
            <CartButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
