import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GestaShop.sn — Votre commerce. Votre stock. Votre caisse.",
  description: "Plateforme de gestion de stock et de caisse pour les commerces sénégalais.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#12b76a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
