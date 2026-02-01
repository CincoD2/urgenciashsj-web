import type { Metadata } from 'next';
import { Encode_Sans, Geist_Mono } from 'next/font/google';

import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieNotice from '@/components/CookieNotice';
import Providers from '@/components/Providers';

const encodeSans = Encode_Sans({
  variable: '--font-encode-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urgenciashsj.es'),
  title: 'urgenciashsj.es',
  description: 'Herramientas y protocolos para Urgencias',
  alternates: {
    canonical: './',
  },
  icons: {
    icon: '/logourg.png',
  },
  openGraph: {
    title: 'urgenciashsj.es',
    description: 'Herramientas y protocolos para Urgencias',
    images: ['/logourg.png'],
  },
  twitter: {
    card: 'summary',
    title: 'urgenciashsj.es',
    description: 'Herramientas y protocolos para Urgencias',
    images: ['/logourg.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? 'G-XG90E6LPT9';

  return (
    <html lang="es">
      <body
        className={`${encodeSans.variable} ${geistMono.variable} min-h-screen antialiased bg-white text-slate-900 flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 flex-1">{children}</main>
          <Footer />
          <CookieNotice gaId={gaId} />
        </Providers>
      </body>
    </html>
  );
}
