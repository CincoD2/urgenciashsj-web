import type { Metadata } from 'next';
import { Encode_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  title: 'urgenciashsj.es',
  description: 'Herramientas y protocolos para Urgencias',
  icons: {
    icon: '/logourg.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${encodeSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
