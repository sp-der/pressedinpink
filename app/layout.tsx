
import type { Metadata } from "next";

import AccountButton from "@/components/AccountButton";
import { AuthProvider } from "@/components/AuthProvider";
import CartButton from "@/components/CartButton";
import { CartProvider } from "@/components/CartProvider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://pressedinpink.com",
  ),
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
    images: [
      {
        url: "/logo.png",
        width: 600,
        height: 600,
        alt: "Pressed In Pink",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
