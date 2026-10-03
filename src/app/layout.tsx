import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { FavoritesFlightLayer } from "@/components/favorites-flight-layer";
import { FavoritesSheet } from "@/components/favorites-sheet";
import { FavoritesProvider } from "@/lib/favorites-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HibridLink — Hub de ofertas",
  description:
    "Hub de ofertas que reúne os melhores preços do Mercado Livre, Shopee e Amazon num só lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionConfig reducedMotion="user">
          <FavoritesProvider>
            {children}
            <FavoritesSheet />
            <FavoritesFlightLayer />
          </FavoritesProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
