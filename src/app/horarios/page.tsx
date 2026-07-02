import HorariosClient from './HorariosClient';

import { getHorarios } from '@/lib/horariosStore';

export const dynamic = 'force-dynamic';

export default async function HorariosPage() {
  const horarios = await getHorarios();

  return <HorariosClient horarios={horarios} />;
}
