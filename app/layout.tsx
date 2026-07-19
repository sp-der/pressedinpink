import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pressed In Pink",
  description:
    "Pressed In Pink offers custom cups, shirts, keychains, wraps, and personalized creations made with love.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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