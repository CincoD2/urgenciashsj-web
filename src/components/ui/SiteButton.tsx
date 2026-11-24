'use client';

import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#2b5d68] bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(43,93,104,0.18)] transition hover:bg-[#234e58] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b5d68] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#cfe0e4] bg-white px-4 py-2 text-sm font-semibold text-[#2b5d68] transition hover:border-[#bcd2d8] hover:bg-[#f5fafb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b5d68] disabled:cursor-not-allowed disabled:opacity-50';

export function SiteButton({ className = '', variant = 'secondary', type = 'button', ...props }: ButtonProps & { variant?: 'primary' | 'secondary' }) {
  return <button type={type} className={`${variant === 'primary' ? primaryButtonClass : secondaryButtonClass} ${className}`} {...props} />;
}

export function FilterButton({ active, filtering = false, count, children, className = '', ...props }: ButtonProps & { active: boolean; filtering?: boolean; count: number }) {
  const hasResults = count > 0;
  return (
    <button type="button" aria-pressed={active} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b5d68] ${
      active
        ? 'border-[#2b5d68] bg-[#2b5d68] text-white shadow-[0_10px_24px_rgba(43,93,104,0.18)]'
        : filtering
          ? hasResults
            ? 'border-[#c7dbe0] bg-[#f5fafb] text-[#355962] shadow-[0_6px_18px_rgba(20,37,45,0.05)] hover:border-[#a9c8cf] hover:bg-white'
            : 'border-[#e5ecee] bg-white/75 text-[#9aaeb3] opacity-60 hover:border-[#d8e4e7] hover:bg-white/90'
          : 'border-[#d7e5e8] bg-white text-[#49646b] hover:border-[#b8d0d6] hover:bg-[#f5fafb]'
    } ${className}`} {...props}>
      <span>{children}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/18 text-white' : filtering ? hasResults ? 'bg-[#dcecf0] text-[#355962]' : 'bg-[#eff4f5] text-[#8ca1a6]' : 'bg-[#edf5f7] text-[#557278]'}`}>{count}</span>
    </button>
  );
}
