import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Seismo One - Where Money Knows First',
  description:
    'Track sudden market movements before news breaks. Real-time prediction market seismograph monitoring 500+ events on Polymarket. When smart money moves, probabilities shift — fast.',
  keywords:
    'prediction markets, polymarket, market movements, probability shifts, seismograph, real-time tracking, breaking news, smart money, betting markets, event probabilities',
  authors: [{ name: 'Seismo One' }],
  creator: 'Seismo One',
  publisher: 'Seismo One',
  openGraph: {
    title: 'Seismo One - Where Money Knows First',
    description:
      'Track sudden market movements before news breaks. Real-time prediction market seismograph.',
    url: 'https://seismo.one',
    siteName: 'Seismo One',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seismo One - Where Money Knows First',
    description:
      'Track sudden market movements before news breaks. Real-time prediction market seismograph.',
    site: '@seismoone',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        className={`${jetbrainsMono.variable} ${inter.variable} bg-background font-mono text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
