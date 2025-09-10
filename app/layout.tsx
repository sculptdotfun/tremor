import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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
  title: 'Tremor - Where Money Talks First',
  description:
    'Track sudden market movements before news breaks. Real-time prediction market monitoring 500+ events on Polymarket. When smart money moves, probabilities shift — fast.',
  keywords:
    'prediction markets, polymarket, market movements, probability shifts, tremor, real-time tracking, breaking news, smart money, betting markets, event probabilities, live markets',
  authors: [{ name: 'Tremor' }],
  creator: 'Tremor',
  publisher: 'Tremor',
  openGraph: {
    title: 'Tremor - Where Money Talks First',
    description:
      'Track sudden market movements before news breaks. Real-time prediction market tremors.',
    url: 'https://tremor.live',
    siteName: 'Tremor',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://tremor.live/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TREMOR - Real-time seismic monitoring for prediction markets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tremor - Where Money Talks First',
    description:
      'Track sudden market movements before news breaks. Real-time prediction market tremors.',
    site: '@tremordotlive',
    creator: '@tremordotlive',
    images: ['https://tremor.live/og-image.png'],
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
    icon: '/tremor-icon.svg',
    shortcut: '/tremor-icon.svg',
    apple: '/tremor-icon.svg',
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
        <Analytics />
      </body>
    </html>
  );
}
