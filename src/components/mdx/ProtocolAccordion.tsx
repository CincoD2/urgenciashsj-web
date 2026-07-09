'use client';

import { useEffect, useId, useRef } from 'react';

type ProtocolAccordionProps = {
  id: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function ProtocolAccordion({
  id,
  title,
  summary,
  defaultOpen = false,
  children,
}: ProtocolAccordionProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const contentId = useId();

  useEffect(() => {
    const syncWithHash = () => {
      if (window.location.hash !== `#${id}`) return;
      if (detailsRef.current) {
        detailsRef.current.open = true;
        detailsRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    };

    syncWithHash();
    window.addEventListener('hashchange', syncWithHash);

    return () => {
      window.removeEventListener('hashchange', syncWithHash);
    };
  }, [id]);

  return (
    <details
      id={id}
      ref={detailsRef}
      open={defaultOpen}
      className="group not-prose my-6 scroll-mt-28 overflow-hidden rounded-[28px] border border-[#d7e5e8] bg-white shadow-[0_16px_40px_rgba(61,118,132,0.08)] open:border-[#c7dadd] open:shadow-[0_20px_50px_rgba(61,118,132,0.12)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-[linear-gradient(135deg,#f7fbfc_0%,#eef6f8_100%)] px-5 py-4 marker:hidden sm:px-6">
        <div className="min-w-0 border-l-4 border-[var(--primary)] pl-4">
          <div className="text-[1.15rem] font-bold tracking-[-0.01em] text-[var(--primary-dark)] sm:text-xl">
            {title}
          </div>
          {summary ? (
            <div className="mt-1.5 max-w-3xl text-[0.95rem] leading-6 text-[#4f6970]">
              {summary}
            </div>
          ) : null}
        </div>
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d2e1e5] bg-white text-[#3d7684] shadow-sm transition group-open:rotate-45 group-open:border-[var(--primary)] group-open:bg-[var(--primary)] group-open:text-white"
        >
          <span className="text-xl leading-none">+</span>
        </div>
      </summary>

      <div id={contentId} className="prose prose-slate max-w-none px-5 py-5 sm:px-6">
        {children}
      </div>
    </details>
  );
}
