import type { Metadata } from 'next';

const pagePath = '/escalas/liquidos-biologicos';
const pageTitle = 'Líquidos Biológicos | Aproximación diagnóstica en Urgencias';
const pageDescription =
  'Herramienta de apoyo para paracentesis, artrocentesis, punción lumbar y toracocentesis con indicaciones, contraindicaciones e interpretación inicial del líquido.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pagePath,
  },
  keywords: [
    'líquidos biológicos',
    'paracentesis',
    'artrocentesis',
    'punción lumbar',
    'toracocentesis',
    'derrame pleural',
    'ascitis',
    'lcr',
    'líquido sinovial',
    'urgencias',
  ],
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pagePath,
    type: 'website',
    images: ['/logourg.png'],
  },
  twitter: {
    card: 'summary',
    title: pageTitle,
    description: pageDescription,
    images: ['/logourg.png'],
  },
};

export default function LiquidosBiologicosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
