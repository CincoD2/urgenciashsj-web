import { permanentRedirect } from 'next/navigation';

export default function DepuradorSiaRedirectPage() {
  permanentRedirect('/escalas/OrionSF?kind=tratamiento');
}
