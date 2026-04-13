'use client';

import { usePathname } from 'next/navigation';

import { getScaleMetaByPath } from '@/lib/escalasMeta';

export default function ScaleMetaPortal() {
  const pathname = usePathname();
  const meta = getScaleMetaByPath(pathname);
  if (!meta || meta.tags.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {meta.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#dfe9eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3d7684]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
