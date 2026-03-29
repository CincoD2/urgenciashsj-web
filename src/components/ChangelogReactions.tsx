'use client';

import { useEffect, useState } from 'react';

import type { ChangelogReactionSummary } from '@/lib/changelog';

type ReactionKey = 'LIKE' | 'DISLIKE' | 'IMPROVABLE';

type Props = {
  entryId: string;
  initialSummary: ChangelogReactionSummary;
};

const STORAGE_KEY = 'uhsj_changelog_visitor_id';
const REACTION_STORAGE_KEY = 'uhsj_changelog_reactions';

const reactionConfig: Array<{
  key: ReactionKey;
  label: string;
  emoji: string;
  summaryKey: keyof ChangelogReactionSummary;
}> = [
  { key: 'LIKE', label: 'Me gusta', emoji: '👍', summaryKey: 'like' },
  { key: 'DISLIKE', label: 'No me gusta', emoji: '👎', summaryKey: 'dislike' },
  { key: 'IMPROVABLE', label: 'Mejorable', emoji: '🫤', summaryKey: 'improvable' },
];

function ensureVisitorId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, nextId);
  return nextId;
}

function readReactionMap(): Record<string, ReactionKey> {
  const raw = window.localStorage.getItem(REACTION_STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, ReactionKey>;
  } catch {
    return {};
  }
}

function writeReaction(entryId: string, reaction: ReactionKey | null) {
  const current = readReactionMap();

  if (reaction) {
    current[entryId] = reaction;
  } else {
    delete current[entryId];
  }

  window.localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(current));
}

export default function ChangelogReactions({ entryId, initialSummary }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [selectedReaction, setSelectedReaction] = useState<ReactionKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readReactionMap();
    setSelectedReaction(stored[entryId] ?? null);
  }, [entryId]);

  async function handleReaction(nextReaction: ReactionKey) {
    if (isSaving) return;

    const visitorId = ensureVisitorId();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/changelog-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId,
          visitorId,
          reaction: nextReaction,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        currentReaction?: ReactionKey | null;
        summary?: ChangelogReactionSummary;
      };

      if (!response.ok || !data.ok || !data.summary) {
        throw new Error(data.error ?? 'No se pudo guardar la reacción.');
      }

      setSummary(data.summary);
      setSelectedReaction(data.currentReaction ?? null);
      writeReaction(entryId, data.currentReaction ?? null);
    } catch {
      setError('No se pudo guardar la reacción.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 flex items-center justify-end">
      <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-[#edf4f6]/80 px-2 py-1">
        {reactionConfig.map((item) => {
          const active = selectedReaction === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleReaction(item.key)}
              disabled={isSaving}
              aria-pressed={active}
              aria-label={item.label}
              title={item.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                active
                  ? 'bg-[#2b5d68] text-white'
                  : 'text-[#5d7479] hover:bg-white hover:text-[#355860]'
              } ${isSaving ? 'cursor-wait opacity-80' : ''}`}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {item.emoji}
              </span>
              <span className={`${active ? 'text-white/90' : 'text-[#6c8489]'}`}>
                {summary[item.summaryKey]}
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="ml-2 text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}
