import type { Metadata } from 'next';

import GuardiaClient from './GuardiaClient';

export const metadata: Metadata = {
  title: 'Herramienta de guardia',
  description: 'Organización de residentes, adjuntos y turnos de noche.',
};

export default function GuardiaPage() {
  return <GuardiaClient />;
}
