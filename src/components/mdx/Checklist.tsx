'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

type ChecklistItem = {
  text: ReactNode;
  checked?: boolean;
};

export function Checklist({
  items,
  interactive = false,
}: {
  items: ChecklistItem[];
  interactive?: boolean;
}) {
  const [checkedItems, setCheckedItems] = useState(() => items.map((item) => Boolean(item.checked)));

  const toggleItem = (index: number) => {
    if (!interactive) return;
    setCheckedItems((prev) => prev.map((value, idx) => (idx === index ? !value : value)));
  };

  return (
    <ul className="my-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      {items.map((item, idx) => (
        <li key={`${item.text}-${idx}`} className="flex items-start gap-2">
          {interactive ? (
            <button
              type="button"
              aria-pressed={checkedItems[idx]}
              aria-label={`Marcar elemento ${idx + 1}`}
              onClick={() => toggleItem(idx)}
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                checkedItems[idx]
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 text-slate-400 hover:border-[#3d7684]'
              }`}
            >
              {checkedItems[idx] ? '✓' : ''}
            </button>
          ) : (
            <span
              aria-hidden
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                checkedItems[idx]
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              {checkedItems[idx] ? '✓' : ''}
            </span>
          )}
          <span className="text-slate-700">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
