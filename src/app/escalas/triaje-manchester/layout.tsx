import type { Metadata } from 'next';

const pagePath = '/escalas/triaje-manchester';
const pageTitle =
  'Triaje Manchester | Herramienta interactiva de clasificación y priorización en Urgencias';
const pageDescription =
  'Herramienta formativa de Triaje Manchester para practicar la clasificación en urgencias, la priorización asistencial y el uso de discriminadores y prioridades del sistema de triaje.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pagePath,
  },
  keywords: [
    'triaje Manchester',
    'Triaje Manchester',
    'clasificación en urgencias',
    'priorización en urgencias',
    'sistema de clasificación',
    'sistema de triaje',
    'triaje en urgencias',
    'niveles de prioridad en urgencias',
    'algoritmo de triaje',
    'discriminadores de triaje',
    'Sistema Español de Triaje',
    'SET',
    'triaje hospitalario',
    'triaje enfermería urgencias',
    'prioridad asistencial urgencias',
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

export default function TriajeManchesterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
