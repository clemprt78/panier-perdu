import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import "./globals.css";

// Polices hébergées avec le site : pas d'appel à Google, affichage plus rapide.
const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "../fonts/fraunces-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/fraunces-latin-800-normal.woff2", weight: "800" },
  ],
});

const plex = localFont({
  variable: "--font-plex",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.promise}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE.name,
    title: SITE.promise,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: SITE.promise, description: SITE.description },
};

export const viewport: Viewport = {
  themeColor: "#1f3d2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${plex.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
