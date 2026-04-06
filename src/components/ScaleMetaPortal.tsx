'use client';

import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getScaleMetaByPath } from '@/lib/escalasMeta';

export default function ScaleMetaPortal() {
  const pathname = usePathname();
  const meta = getScaleMetaByPath(pathname);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!meta) return;

    let frame = 0;
    let created: HTMLElement | null = null;

    const mount = () => {
      const heading = document.querySelector('h1');
      if (!heading || !heading.parentElement) return;

      const existing = heading.parentElement.querySelector<HTMLElement>('[data-scale-meta-anchor="1"]');
      const nextAnchor = existing ?? document.createElement('div');

      if (!existing) {
        nextAnchor.setAttribute('data-scale-meta-anchor', '1');
        heading.insertAdjacentElement('afterend', nextAnchor);
        created = nextAnchor;
      }

      setAnchor(nextAnchor);
    };

    frame = window.requestAnimationFrame(mount);
    return () => {
      window.cancelAnimationFrame(frame);
      if (created?.parentNode) {
        created.parentNode.removeChild(created);
      }
    };
  }, [meta, pathname]);

  if (!meta || !anchor || meta.tags.length === 0) return null;

  return createPortal(
    <div className="mt-3 flex flex-wrap gap-2">
      {meta.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#dfe9eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3d7684]"
        >
          {tag}
        </span>
      ))}
    </div>,
    anchor
  );
}
