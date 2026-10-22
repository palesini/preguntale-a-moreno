import type { Metadata, Viewport } from "next";
import { Anton, Barlow } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preguntaleamoreno.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Preguntale a Moreno",
  description: "Preguntale lo que quieras a Guillermo Moreno. Asistente de IA entrenado con sus frases públicas.",
  openGraph: {
    title: "Preguntale a Moreno",
    description: "La economía es producción y trabajo, no especulación y renta. Preguntá lo que quieras.",
    type: "website",
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", title: "Preguntale a Moreno" },
};

export const viewport: Viewport = {
  themeColor: "#74ACDF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${barlow.variable} ${anton.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
