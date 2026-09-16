import type { Metadata } from 'next';

const pagePath = '/escalas/OrionSF';
const pageTitle = 'Resumidor de tratamientos Orion | Orion Smart Formatter';
const pageDescription =
  'Resumidor de tratamientos de Orion y formateador de analíticas para Urgencias. Detecta tratamientos y resultados, permite seleccionar su contenido y consultar principios activos en AEMPS.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pagePath },
  keywords: [
    'resumidor tratamientos Orion',
    'resumen de tratamientos Orion',
    'Orion Smart Formatter',
    'formateador Orion',
    'depurador tratamientos SIA',
    'resumir tratamiento farmacológico',
    'formateador de analíticas',
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

export default function OrionSfLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
