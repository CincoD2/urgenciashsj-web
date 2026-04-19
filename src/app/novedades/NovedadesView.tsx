import type { ReactNode } from 'react';
import Link from 'next/link';

import ChangelogReactions from '@/components/ChangelogReactions';
import type { ChangelogEntry } from '@/lib/changelog';

export const CHANGELOG_PAGE_SIZE = 6;

export function getChangelogPageCount(totalEntries: number) {
  return Math.max(1, Math.ceil(totalEntries / CHANGELOG_PAGE_SIZE));
}

export function getNovedadesPageHref(page: number) {
  return page <= 1 ? '/novedades' : `/novedades/pagina/${page}`;
}

function renderInlineMarkdown(line: string) {
  const nodes: ReactNode[] = [];
  const tokenRegex =
    /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/(?:[^\s)]*)?)\)|https?:\/\/[^\s]+)/g;
  const parts = line.split(tokenRegex);

  parts.forEach((part, idx) => {
    if (!part) return;

    const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?:[^\s)]*)?)\)$/);
    if (mdLinkMatch) {
      const [, label, url] = mdLinkMatch;
      nodes.push(
        <a
          key={`${idx}-${url}`}
          href={url}
          target={url.startsWith('http') ? '_blank' : undefined}
          rel={url.startsWith('http') ? 'noreferrer' : undefined}
          className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#2b5d68]"
        >
          {label}
        </a>
      );
      return;
    }

    if (part.startsWith('http://') || part.startsWith('https://')) {
      nodes.push(
        <a
          key={`${idx}-${part}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#2b5d68]"
        >
          {part}
        </a>
      );
      return;
    }

    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      nodes.push(
        <strong key={`${idx}-${boldMatch[1]}`} className="font-semibold text-slate-900">
          {boldMatch[1]}
        </strong>
      );
      return;
    }

    nodes.push(<span key={`${idx}-${part}`}>{part}</span>);
  });

  return nodes;
}

export default function NovedadesView({
  entries,
  currentPage,
}: {
  entries: ChangelogEntry[];
  currentPage: number;
}) {
  const totalPages = getChangelogPageCount(entries.length);
  const startIndex = (currentPage - 1) * CHANGELOG_PAGE_SIZE;
  const pageEntries = entries.slice(startIndex, startIndex + CHANGELOG_PAGE_SIZE);
  const firstEntryNumber = entries.length === 0 ? 0 : startIndex + 1;
  const lastEntryNumber = startIndex + pageEntries.length;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Novedades en UrgenciasHSJ.es</h1>
        <p className="text-sm text-[#516f75]">Cambios recientes y mejoras en urgenciashsj.es.</p>
        {entries.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7f83]">
            <span className="rounded-full border border-[#dfe9eb] bg-white px-2.5 py-1">
              Página {currentPage} de {totalPages}
            </span>
            <span className="rounded-full border border-[#dfe9eb] bg-white px-2.5 py-1">
              {firstEntryNumber}-{lastEntryNumber} de {entries.length} entradas
            </span>
            <span className="rounded-full border border-[#dfe9eb] bg-white px-2.5 py-1">
              {CHANGELOG_PAGE_SIZE} por página
            </span>
          </div>
        ) : null}
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 text-sm text-[#516f75]">
          Aún no hay novedades publicadas.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pageEntries.map((entry) => (
              <article
                key={entry.id}
                id={entry.id}
                className="scroll-mt-24 rounded-2xl border border-[#dfe9eb] bg-[#f7fbfc] p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{entry.title}</h2>
                  <span className="text-xs text-[#6b7f83]">{entry.date}</span>
                </div>
                {entry.summary && <p className="mt-2 text-sm text-[#3f5f66]">{entry.summary}</p>}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#dfe9eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3d7684]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {entry.body && (
                  <div className="mt-3 text-sm text-[#3f5f66]">
                    {entry.body.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-1">
                        {renderInlineMarkdown(line)}
                      </p>
                    ))}
                  </div>
                )}

                <ChangelogReactions
                  entryId={entry.id}
                  initialSummary={{
                    like: 0,
                    dislike: 0,
                    improvable: 0,
                  }}
                />
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Paginación de novedades"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe9eb] bg-white px-4 py-3"
            >
              <div className="text-sm text-[#516f75]">
                {currentPage === 1
                  ? 'Mostrando las entradas más recientes.'
                  : 'Mostrando entradas anteriores del changelog.'}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={getNovedadesPageHref(currentPage - 1)}
                    className="rounded-full border border-[#dfe9eb] px-3 py-1.5 text-sm text-[#355860] transition hover:border-[#b9d1d6] hover:bg-[#f4f9fa]"
                  >
                    ← Más recientes
                  </Link>
                ) : (
                  <span className="rounded-full border border-[#edf4f6] px-3 py-1.5 text-sm text-[#9ab0b5]">
                    ← Más recientes
                  </span>
                )}

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) =>
                  page === currentPage ? (
                    <span
                      key={page}
                      aria-current="page"
                      className="rounded-full bg-[#2b5d68] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      {page}
                    </span>
                  ) : (
                    <Link
                      key={page}
                      href={getNovedadesPageHref(page)}
                      className="rounded-full border border-[#dfe9eb] px-3 py-1.5 text-sm text-[#355860] transition hover:border-[#b9d1d6] hover:bg-[#f4f9fa]"
                    >
                      {page}
                    </Link>
                  )
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={getNovedadesPageHref(currentPage + 1)}
                    className="rounded-full border border-[#dfe9eb] px-3 py-1.5 text-sm text-[#355860] transition hover:border-[#b9d1d6] hover:bg-[#f4f9fa]"
                  >
                    Más antiguas →
                  </Link>
                ) : (
                  <span className="rounded-full border border-[#edf4f6] px-3 py-1.5 text-sm text-[#9ab0b5]">
                    Más antiguas →
                  </span>
                )}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
