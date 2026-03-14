import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ConsentNotice } from "@/components/auth/ConsentNotice";
import { ServiceWorkerKiller } from "@/components/ServiceWorkerKiller";
import "./globals.css";
import "leaflet/dist/leaflet.css";

// Google Fonts
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/900.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

export const metadata: Metadata = {
  title: "MittiMitra (AgriChain)",
  description: "The Temporal Arbitrage Engine for Farmers",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#20FFBD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-forest min-h-screen overflow-x-hidden">
        <LanguageProvider>
          <ConsentNotice />
          <ServiceWorkerKiller />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
