import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { loadChangelog } from '@/lib/changelog';

import NovedadesView, {
  getChangelogPageCount,
  getNovedadesPageHref,
} from '../../NovedadesView';

export const revalidate = 3600;

type PageParams = Promise<{ page: string }>;

function parsePageParam(value: string) {
  if (!/^\d+$/.test(value)) return null;

  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return null;

  return page;
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { page } = await params;
  const parsedPage = parsePageParam(page);

  if (!parsedPage || parsedPage <= 1) {
    return {
      title: 'Novedades',
      description: 'Cambios y novedades del sitio',
    };
  }

  return {
    title: `Novedades · Página ${parsedPage}`,
    description: 'Entradas anteriores del changelog de UrgenciasHSJ.es',
    alternates: {
      canonical: getNovedadesPageHref(parsedPage),
    },
  };
}

export async function generateStaticParams() {
  const totalPages = getChangelogPageCount(loadChangelog().length);

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export default async function NovedadesArchivePage({
  params,
}: {
  params: PageParams;
}) {
  const { page } = await params;
  const parsedPage = parsePageParam(page);

  if (!parsedPage) notFound();
  if (parsedPage === 1) redirect('/novedades');

  const entries = loadChangelog();
  const totalPages = getChangelogPageCount(entries.length);

  if (parsedPage > totalPages) notFound();

  return <NovedadesView entries={entries} currentPage={parsedPage} />;
}
