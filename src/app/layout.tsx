import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import Script from "next/script";
import "./globals.css";
import { FavoritesFlightLayer } from "@/components/favorites-flight-layer";
import { FavoritesSheet } from "@/components/favorites-sheet";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/components/theme-provider";
import { categoryCounts } from "@/lib/deals";
import { FavoritesProvider } from "@/lib/favorites-context";
import { getCatalog } from "@/lib/offers";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { products, live } = await getCatalog();
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Sets the theme class before first paint; a plain <script> here warns in React 19. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <FavoritesProvider>
              <SiteHeader categories={categoryCounts(products)} showCounts={live} />
              {children}
              <FavoritesSheet />
              <FavoritesFlightLayer />
            </FavoritesProvider>
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
