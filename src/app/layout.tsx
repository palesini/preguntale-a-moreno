import type { Metadata } from "next";
import { Playfair_Display, Lora, Crimson_Text } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "El Modo Guillermo — Chatbot Doctrinario Peronista",
  description:
    "Chatbot con la personalidad de Guillermo Moreno. Hablá con él al modo doctrinario puro. Reindustrializá la conversación.",
  keywords: [
    "Guillermo Moreno",
    "peronismo",
    "doctrina peronista",
    "chatbot",
    "Argentina",
    "producción y trabajo",
  ],
  authors: [{ name: "El Modo Guillermo" }],
  openGraph: {
    title: "El Modo Guillermo",
    description: "Chatbot doctrinario con la personalidad de Guillermo Moreno.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${lora.variable} ${crimson.variable} antialiased`}
        style={{ fontFamily: "var(--font-lora), serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
