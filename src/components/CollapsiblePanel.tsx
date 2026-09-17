'use client';

import { useState, type ReactNode } from 'react';

type CollapsiblePanelProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function CollapsiblePanel({ title, children, defaultOpen = false }: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="w-full min-w-0 self-start overflow-hidden rounded-2xl border border-[#dfe9eb] bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center gap-3 border-b border-[#dfe9eb] bg-[#f7fbfc] px-5 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7e4ee] bg-[#f7fbfc] text-[#5d767d] transition hover:border-[#b7d3da] hover:bg-[#eef6f8] hover:text-[#2b5d68] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5a7f8a]/25"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`h-4 w-4 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            <path d="m8 6 4 4-4 4" />
          </svg>
        </span>
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#1f4c57]">{title}</h2>
      </button>
      {/* The entire heading is the disclosure control, matching the Orion SF pattern. */}
      {/* Kept outside the content wrapper so the panel can animate independently. */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
