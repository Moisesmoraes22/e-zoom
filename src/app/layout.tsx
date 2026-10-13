import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AdSenseLoader, ClarityLoader, CookieBanner } from "@/components/cookie-consent";
import { LazyOverlays } from "@/components/lazy-overlays";
import { MotionProvider } from "@/components/motion-provider";
import { RequestNotice } from "@/components/request-notice";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/components/theme-provider";
import { FavoritesProvider } from "@/lib/favorites-context";
import { getSiteSummary } from "@/lib/offers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezooom.com.br",
  ),
  title: {
    default: "E-Zooom — Ofertas do Mercado Livre, Shopee e Amazon",
    template: "%s — E-Zooom",
  },
  description:
    "Hub de ofertas que reúne os melhores preços do Mercado Livre, Shopee e Amazon num só lugar.",
  // Lets Google AdSense verify ownership of the site; it sets no cookie and loads no script.
  other: { "google-adsense-account": "ca-pub-5930842502912656" },
  openGraph: {
    siteName: "E-Zooom",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { categories, live } = await getSiteSummary();
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${jakarta.variable} h-full antialiased`}
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
          <AuthProvider>
            <MotionProvider>
              <FavoritesProvider>
                <SiteHeader categories={categories} showCounts={live} />
                <RequestNotice />
                {children}
                <LazyOverlays />
                {/* Inside MotionProvider: its animation features (LazyMotion strict) are loaded there. */}
                <CookieBanner />
              </FavoritesProvider>
            </MotionProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <ClarityLoader />
        <AdSenseLoader />
      </body>
    </html>
  );
}
