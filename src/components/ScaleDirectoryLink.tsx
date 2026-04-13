'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ScaleDirectoryLink() {
  const pathname = usePathname();

  if (!pathname || pathname === '/escalas' || !pathname.startsWith('/escalas/')) {
    return null;
  }

  return (
    <div className="mb-4">
      <Link
        href="/escalas"
        className="inline-flex items-center gap-2 rounded-full border border-[#d7e5e8] bg-white px-4 py-2 text-sm font-medium text-[#49646b] shadow-sm transition hover:border-[#b8d0d6] hover:bg-[#f5fafb] hover:text-[#2b5d68]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M15 6 9 12l6 6" />
        </svg>
        Ver todas las herramientas
      </Link>
    </div>
  );
}
