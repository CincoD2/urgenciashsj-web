'use client';

import { useEffect, useState } from 'react';

type ScaleItem = {
  href: string;
  label: string;
};

type ScaleModalChipsProps = {
  className?: string;
  title?: string;
  items: ScaleItem[];
};

export function ScaleModalChips({ className, title, items }: ScaleModalChipsProps) {
  const [activeItem, setActiveItem] = useState<ScaleItem | null>(null);

  const getEmbedHref = (href: string) => {
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}embed=1`;
  };

  useEffect(() => {
    if (!activeItem) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveItem(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeItem]);

  return (
    <>
      <div className={`mt-5 flex flex-wrap items-center gap-2 ${className ?? ''}`.trim()}>
        {title ? <span className="mr-1 text-sm font-medium text-slate-600">{title}</span> : null}
        {items.map((item) => (
          <button
            key={`${item.href}-${item.label}`}
            type="button"
            onClick={() => setActiveItem(item)}
            className="rounded-full border border-[#dfe9eb] bg-white px-3 py-1 text-[11px] font-semibold text-[#3d7684] transition hover:border-[#c8dadd] hover:text-[#2b5d68]"
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="absolute inset-0" onClick={() => setActiveItem(null)} />
          <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#dfe9eb] px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{activeItem.label}</h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeItem.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#dfe9eb] px-3 py-1.5 text-xs font-semibold text-[#3d7684] no-underline transition hover:bg-[#f7fbfc]"
                >
                  Abrir aparte
                </a>
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <iframe
              key={activeItem.href}
              src={getEmbedHref(activeItem.href)}
              title={activeItem.label}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
