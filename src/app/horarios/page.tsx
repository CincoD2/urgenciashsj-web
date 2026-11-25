import HorariosClient from './HorariosClient';

import { getHorarios } from '@/lib/horariosStore';

export const dynamic = 'force-dynamic';

export default async function HorariosPage() {
  const horarios = await getHorarios();
  // The annual rota is available even before monthly PDFs have been published.
  if (!horarios.some(item => item.year === 2027)) {
    horarios.push({ year: 2027, months: {} });
    horarios.sort((a, b) => b.year - a.year);
  }

  return <HorariosClient horarios={horarios} />;
}
