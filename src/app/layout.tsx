import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://modo-guillermo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "El Modo Moreno",
  description:
    "Preguntale lo que quieras a Guillermo Moreno. Asistente de IA entrenado con sus frases públicas. Principios y Valores.",
  openGraph: {
    title: "El Modo Moreno",
    description: "Preguntale lo que quieras. La economía es producción y trabajo, no especulación y renta.",
    type: "website",
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", title: "El Modo Moreno" },
};

export const viewport: Viewport = {
  themeColor: "#0A2350",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
