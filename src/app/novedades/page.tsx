import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import Link from 'next/link';

export const metadata = {
  title: 'Novedades | urgenciashsj.es',
  description: 'Cambios y novedades del sitio',
};

type ChangelogEntry = {
  title: string;
  date: string;
  summary?: string;
  link?: string;
  tags?: string[];
  body?: string;
};

function loadChangelog(): ChangelogEntry[] {
  const dir = path.join(process.cwd(), 'content/changelog');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data, content } = matter(raw);

      return {
        title: (data.title as string) ?? file.replace(/\.(md|mdx)$/i, ''),
        date: (data.date as string) ?? '1970-01-01',
        summary: data.summary as string | undefined,
        link: data.link as string | undefined,
        tags: (data.tags as string[]) ?? [],
        body: content.trim(),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function NovedadesPage() {
  const entries = loadChangelog();

  function renderLineWithLinks(line: string) {
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
    const mdParts = line.split(mdLinkRegex);
    const nodes: React.ReactNode[] = [];

    for (let i = 0; i < mdParts.length; i += 3) {
      const textChunk = mdParts[i];
      const mdLabel = mdParts[i + 1];
      const mdUrl = mdParts[i + 2];

      if (textChunk) {
        const parts = textChunk.split(/(https?:\/\/[^\s]+)/g);
        parts.forEach((part, idx) => {
          if (part.startsWith('http://') || part.startsWith('https://')) {
            nodes.push(
              <a
                key={`${part}-${i}-${idx}`}
                href={part}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#2b5d68]"
              >
                {part}
              </a>
            );
          } else if (part) {
            nodes.push(<span key={`${part}-${i}-${idx}`}>{part}</span>);
          }
        });
      }

      if (mdLabel && mdUrl) {
        nodes.push(
          <a
            key={`${mdUrl}-${i}`}
            href={mdUrl}
            target={mdUrl.startsWith('http') ? '_blank' : undefined}
            rel={mdUrl.startsWith('http') ? 'noreferrer' : undefined}
            className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#2b5d68]"
          >
            {mdLabel}
          </a>
        );
      }
    }

    return nodes;
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3d7684]">Changelog</p>
        <h1 className="text-2xl font-semibold text-slate-900">Novedades en UrgenciasHSJ.es</h1>
        <p className="text-sm text-[#516f75]">
          Cambios recientes y mejoras en urgenciashsj.es, con enlaces a las páginas afectadas.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 text-sm text-[#516f75]">
          Aún no hay novedades publicadas.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <article
              key={`${entry.date}-${entry.title}`}
              className="rounded-2xl border border-[#dfe9eb] bg-[#f7fbfc] p-5"
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
                      {renderLineWithLinks(line)}
                    </p>
                  ))}
                </div>
              )}

              {entry.link && (
                <div className="mt-4">
                  <Link
                    href={entry.link}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#3d7684] hover:text-[#2b5d68]"
                  >
                    Ver novedades
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
