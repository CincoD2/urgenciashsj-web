import ChangelogReactions from '@/components/ChangelogReactions';
import { getChangelogReactionSummary, loadChangelog } from '@/lib/changelog';

export const metadata = {
  title: 'Novedades',
  description: 'Cambios y novedades del sitio',
};

export default async function NovedadesPage() {
  const entries = loadChangelog();
  const reactionSummary = await getChangelogReactionSummary(entries.map((entry) => entry.id));

  function renderInlineMarkdown(line: string) {
    const nodes: React.ReactNode[] = [];
    const tokenRegex =
      /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)|https?:\/\/[^\s]+)/g;
    const parts = line.split(tokenRegex);

    parts.forEach((part, idx) => {
      if (!part) return;

      const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/);
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

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Novedades en UrgenciasHSJ.es</h1>
        <p className="text-sm text-[#516f75]">Cambios recientes y mejoras en urgenciashsj.es.</p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 text-sm text-[#516f75]">
          Aún no hay novedades publicadas.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <article
              key={entry.id}
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
                      {renderInlineMarkdown(line)}
                    </p>
                  ))}
                </div>
              )}

              <ChangelogReactions
                entryId={entry.id}
                initialSummary={
                  reactionSummary[entry.id] ?? {
                    like: 0,
                    dislike: 0,
                    improvable: 0,
                  }
                }
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
