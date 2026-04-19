import { loadChangelog } from '@/lib/changelog';
import NovedadesView from './NovedadesView';

export const metadata = {
  title: 'Novedades',
  description: 'Cambios y novedades del sitio',
};

export const revalidate = 3600;

export default async function NovedadesPage() {
  return <NovedadesView entries={loadChangelog()} currentPage={1} />;
}
