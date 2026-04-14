import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import matter from 'gray-matter';
import Link from 'next/link';
import { getTopConsultedPages } from '@/lib/ga4';
import HomeSearchHighlighter from '@/components/HomeSearchHighlighter';
import HomeHeroSearch from '@/components/HomeHeroSearch';
import {
  documentosInteres,
  enlacesCorporativos,
  enlacesInteres,
  getHomeSearchTargetId,
  observacion,
  type EndIconKey,
  type IconKey,
  type LinkItem,
} from '@/lib/homeContent';

const calendarEmbed =
  'https://www.google.com/calendar/embed?color=%23b90e28&color=%23f691b2&src=0mg852tsvqgekgud1j3g2ud4rk@group.calendar.google.com&src=6d41e36m9j14i3c1ovrvum1qdihm4d36@import.calendar.google.com&mode=AGENDA';

const homePath = '/';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urgenciashsj.es';
const homeTitle = 'UrgenciasHSJ | Herramientas y contenidos para Urgencias';
const homeDescription =
  'UrgenciasHSJ.es surge con el objetivo de concentrar en un único espacio las herramientas y contenidos necesarios para el trabajo diario en un turno de urgencias, facilitando el acceso rápido a información protocolizada y contribuyendo a mejorar el flujo de trabajo asistencial.';

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: homePath,
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: homePath,
    type: 'website',
    images: ['/logourg.png'],
  },
  twitter: {
    card: 'summary',
    title: homeTitle,
    description: homeDescription,
    images: ['/logourg.png'],
  },
};

function Icon({ name }: { name: IconKey }) {
  const common = 'h-4 w-4';
  switch (name) {
    case 'person':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M5 21c1.5-4 12.5-4 14 0" />
        </svg>
      );
    case 'money':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 9v6M17 9v6" />
        </svg>
      );
    case 'internet':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a12 12 0 0 1 0 18M12 3a12 12 0 0 0 0 18" />
        </svg>
      );
    case 'mail':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case 'book':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 4h10a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3z" />
          <path d="M4 4v16a3 3 0 0 1 3-3h10" />
        </svg>
      );
    case 'grad':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 7l10-4 10 4-10 4-10-4z" />
          <path d="M6 10v5c0 2 4 3 6 3s6-1 6-3v-5" />
        </svg>
      );
    case 'computer':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M10 16l-1 4M14 16l1 4" />
        </svg>
      );
    case 'wrench':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 7a4 4 0 0 0-5 5L4 17l3 3 5-5a4 4 0 0 0 5-5z" />
        </svg>
      );
    case 'flask':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 2h6" />
          <path d="M10 2v5l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V2" />
        </svg>
      );
    case 'xray':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h6" />
        </svg>
      );
    case 'drop':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
        </svg>
      );
    case 'agenda':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 2v4M17 2v4M3 9h18" />
        </svg>
      );
  }
}

function IntranetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.696-3.534c.63 0 1.332-.288 2.196-1.458l.911-1.22a.334.334 0 0 0-.074-.472.38.38 0 0 0-.505.06l-1.475 1.679a.241.241 0 0 1-.279.061.211.211 0 0 1-.12-.244l1.858-7.446a.499.499 0 0 0-.575-.613l-3.35.613a.35.35 0 0 0-.276.258l-.086.334a.25.25 0 0 0 .243.312h1.73l-1.476 5.922c-.054.234-.144.63-.144.918 0 .666.396 1.296 1.422 1.296zm1.83-10.536c.702 0 1.242-.414 1.386-1.044.036-.144.054-.306.054-.414 0-.504-.396-.972-1.134-.972-.702 0-1.242.414-1.386 1.044a1.868 1.868 0 0 0-.054.414c0 .504.396.972 1.134.972z" />
    </svg>
  );
}

function PhoneSheetIcon() {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M3.5 8H3V7H3.5C3.77614 7 4 7.22386 4 7.5C4 7.77614 3.77614 8 3.5 8Z"
        fill="#3d7684"
      />
      <path
        d="M7 10V7H7.5C7.77614 7 8 7.22386 8 7.5V9.5C8 9.77614 7.77614 10 7.5 10H7Z"
        fill="#3d7684"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 1.5C1 0.671573 1.67157 0 2.5 0H10.7071L14 3.29289V13.5C14 14.3284 13.3284 15 12.5 15H2.5C1.67157 15 1 14.3284 1 13.5V1.5ZM3.5 6H2V11H3V9H3.5C4.32843 9 5 8.32843 5 7.5C5 6.67157 4.32843 6 3.5 6ZM7.5 6H6V11H7.5C8.32843 11 9 10.3284 9 9.5V7.5C9 6.67157 8.32843 6 7.5 6ZM10 11V6H13V7H11V8H12V9H11V11H10Z"
        fill="#3d7684"
      />
    </svg>
  );
}

function EndIcon({ name }: { name: EndIconKey }) {
  switch (name) {
    case 'phoneSheet':
      return <PhoneSheetIcon />;
  }
  return null;
}

function LinkList({ items, section }: { items: LinkItem[]; section: string }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} data-home-search-target={getHomeSearchTargetId(section, it.label)}>
          {it.href ? (
            <a
              href={it.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 underline decoration-slate-300 underline-offset-4 hover:text-slate-700"
            >
              {it.icon ? (
                <span className="text-[#3d7684]">
                  <Icon name={it.icon} />
                </span>
              ) : null}
              <span>{it.label}</span>
              {it.endIcon ? <EndIcon name={it.endIcon} /> : null}
              {it.intranet ? (
                <span
                  className="ml-1 text-[#6b7f83]"
                  title="accesible solo intranet"
                  aria-label="accesible solo intranet"
                >
                  <IntranetIcon />
                </span>
              ) : null}
            </a>
          ) : (
            <span>{it.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

type TopPage = {
  path: string;
  views: number;
};

function loadLatestChangelog(limit: number) {
  const dir = path.join(process.cwd(), 'content/changelog');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);

      return {
        title: (data.title as string) ?? file.replace(/\.(md|mdx)$/i, ''),
        date: (data.date as string) ?? '1970-01-01',
        summary: data.summary as string | undefined,
      };
    })
    .filter((entry) => {
      const parsed = new Date(entry.date);
      return !Number.isNaN(parsed.getTime());
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

function formatTopPageLabel(pathname: string) {
  return pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment).replace(/[-_]+/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ');
}

function formatViews(value: number) {
  return new Intl.NumberFormat('es-ES').format(value);
}

export default async function HomePage() {
  const latestChangelog = loadLatestChangelog(3);
  const topPages = await getTopConsultedPages(5);
  const showHighlights = latestChangelog.length > 0 || topPages.length > 0;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UrgenciasHSJ',
    alternateName: 'urgenciashsj.es',
    url: siteUrl,
    description: homeDescription,
    inLanguage: 'es',
  };

  return (
    <div className="space-y-10" data-home-search-root>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={null}>
        <HomeSearchHighlighter />
      </Suspense>
      <section className="relative -mx-4 -mt-16 h-[340px] pt-9">
        <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: 'url(/urg-background.png)',
              backgroundPosition: 'center 18%',
            }}
          />
          <div className="absolute inset-0 bg-white/60" />
        </div>
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center">
            <h1 className="text-4xl font-semibold text-black">UrgenciasHSJ</h1>
            <p className="mt-2 text-black">Recursos de Urgencias</p>
            <div className="mt-3 h-1 w-20 rounded-full bg-[#3d7684]" />
            <Suspense fallback={null}>
              <HomeHeroSearch />
            </Suspense>
          </div>
        </div>
      </section>

      {showHighlights && (
        <div className="grid gap-4 lg:grid-cols-3">
          {latestChangelog.length > 0 ? (
            <Link
              href="/novedades"
              data-home-search-target="home-novedades"
              className="block rounded-2xl border border-[#cfe2e6] bg-[#eef6f8] p-4 transition hover:border-[#b8d3da] hover:bg-[#e6f2f5] lg:col-span-2"
            >
              <div className="space-y-2 text-sm text-[#3f5f66]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    Novedades
                  </span>
                  <span className="text-xs font-semibold text-[#2b5d68]">Ver todo →</span>
                </div>
                <div className="space-y-1.5">
                  {latestChangelog.map((entry) => (
                    <div
                      key={`${entry.date}-${entry.title}`}
                      className="grid grid-cols-[88px_1fr] gap-x-3"
                    >
                      <span className="text-xs text-[#6b7f83] pt-0.5">{entry.date}</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900">{entry.title}</span>
                        {entry.summary ? (
                          <span className="text-xs text-[#7b8f94] ml-2">— {entry.summary}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ) : null}

          {topPages.length > 0 ? (
            <section className="rounded-2xl border border-[#c8dde3] bg-[#e8f2f4] p-4">
              <div data-home-search-target="home-top-consultadas">
                <div className="space-y-2 text-sm text-[#3f5f66]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      Top consultadas
                    </span>
                    <span className="text-xs text-[#6b7f83]">30 días</span>
                  </div>
                  <div className="space-y-0.5">
                    {topPages.map((page: TopPage) => (
                      <Link
                        key={page.path}
                        href={page.path}
                        className="flex items-start justify-between gap-3 rounded-md px-2 py-0.5 hover:bg-[#f3f8f9]"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-900">
                          {formatTopPageLabel(page.path)}
                        </span>
                        <span className="shrink-0 text-xs text-[#6b7f83]">
                          {formatViews(page.views)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}

      <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Enlaces Corporativos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(enlacesCorporativos).map(([grupo, items]) => (
            <div key={grupo} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#516f75]">
                {grupo}
              </h3>
              <LinkList items={items} section={`Enlaces corporativos · ${grupo}`} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3"
          data-home-search-target={getHomeSearchTargetId('Nivel 2 · Observación', 'Nivel 2 · Observación')}
        >
          <h2 className="text-xl font-semibold">Nivel 2 · Observación</h2>
          <LinkList items={observacion} section="Nivel 2 · Observación" />
        </section>

        <section
          className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3"
          data-home-search-target={getHomeSearchTargetId('Documentos de Interés', 'Documentos de Interés')}
        >
          <h2 className="text-xl font-semibold">Documentos de Interés</h2>
          <LinkList items={documentosInteres} section="Documentos de Interés" />
        </section>

        <section
          className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3"
          data-home-search-target={getHomeSearchTargetId('Enlaces de Interés', 'Enlaces de Interés')}
        >
          <h2 className="text-xl font-semibold">Enlaces de Interés</h2>
          <LinkList items={enlacesInteres} section="Enlaces de Interés" />
        </section>
      </div>

      <section
        className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3"
        data-home-search-target="home-eventos"
      >
        <h2 className="text-xl font-semibold">Próximos eventos relacionados</h2>
        <div className="overflow-hidden rounded-md border border-[#dfe9eb]">
          <iframe title="Calendario de eventos" src={calendarEmbed} className="h-[500px] w-full" />
        </div>
      </section>
    </div>
  );
}
