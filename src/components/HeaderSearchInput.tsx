'use client';

import { useRef } from 'react';

export default function HeaderSearchInput({ id, label, placeholder, value, onChange }: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex max-w-3xl items-center gap-3 rounded-[1.2rem] border border-white/70 bg-white/80 px-4 py-3 text-[#6a7f85] shadow-[0_12px_30px_rgba(20,37,45,0.08)] backdrop-blur-sm">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        // Safari puede mostrar su botón nativo incluso al ocultarlo con CSS.
        type="text"
        role="searchbox"
        inputMode="search"
        enterKeyHint="search"
        id={id}
        name={id}
        autoComplete="off"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="header-search-input min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-[#8aa0a6]"
      />
        <button type="button" className="buscador-clear" style={{ visibility: value ? 'visible' : 'hidden' }} disabled={!value} tabIndex={value ? 0 : -1} aria-label="Borrar búsqueda" onClick={() => {
          onChange('');
          inputRef.current?.focus();
        }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
    </div>
  );
}
