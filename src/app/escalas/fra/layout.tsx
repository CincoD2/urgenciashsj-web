import type { Metadata } from 'next';

const pagePath = '/escalas/fra';
const pageTitle = 'Fracaso Renal Agudo | Asistente KDIGO y orientación etiológica en Urgencias';
const pageDescription =
  'Herramienta de apoyo a decisión clínica para confirmar criterios KDIGO de fracaso renal agudo, estimar estadio, orientar etiología y proponer manejo inicial en Urgencias.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pagePath,
  },
  keywords: [
    'fracaso renal agudo',
    'lesion renal aguda',
    'kdigo',
    'AKI',
    'insuficiencia renal aguda',
    'etiologia prerrenal',
    'obstruccion urinaria',
    'manejo en urgencias',
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

export default function FraLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
