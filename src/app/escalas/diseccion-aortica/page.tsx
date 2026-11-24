import type { Metadata } from 'next';
import AortaProtocol from './AortaProtocol';

export const metadata: Metadata = {
  title: 'Disección aguda de aorta',
  description: 'Clasificación Stanford y TEM, ADD-RS, manejo inicial y lista de verificación del traslado del síndrome aórtico agudo.',
};

export default function DiseccionAorticaPage() {
  return <AortaProtocol />;
}
