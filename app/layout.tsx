import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Seismo One - World's Fastest News Source",
  description: "Real-time prediction market monitoring. Markets beat newsrooms every time. Track probability shifts as they happen.",
  keywords: "prediction markets, polymarket, real-time news, market movements, probability tracking, breaking news",
  authors: [{ name: "Seismo One" }],
  creator: "Seismo One",
  publisher: "Seismo One",
  openGraph: {
    title: "Seismo One - World's Fastest News Source",
    description: "Real-time prediction market monitoring. Markets beat newsrooms every time.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seismo One - World's Fastest News Source",
    description: "Real-time prediction market monitoring. Markets beat newsrooms every time.",
  },
  icons: {
    icon: '/seismo-icon.svg',
    shortcut: '/seismo-icon.svg',
    apple: '/seismo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${inter.variable} font-mono bg-background text-foreground antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
