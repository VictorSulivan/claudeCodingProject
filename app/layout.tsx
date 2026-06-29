import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Highlands — Gestion d'événements",
  description: "Plateforme de gestion des événements et équipes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
