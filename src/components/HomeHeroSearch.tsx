'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

type Result = { type: string; title: string; url: string; snippet?: string };
const MIN_QUERY_LENGTH = 3;

function getTypeLabel(type: string) {
  if (type === 'herramienta') return 'Herramienta';
  if (type === 'dieta') return 'Macro';
  if (type === 'formacion') return 'Formación';
  if (type === 'sesion') return 'Sesión';
  if (type === 'page') return 'Inicio';
  if (type === 'horario') return 'Horarios';
  return type;
}

export default function HomeHeroSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeSearchParam = searchParams.get('homeSearch') ?? '';
  const homeFocusParam = searchParams.get('homeFocus') ?? '';
  const [query, setQuery] = useState(homeSearchParam);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const trackedNoResultQueries = useRef<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement | null>(null);
  const collapsedInputRef = useRef<HTMLInputElement | null>(null);
  const expandedInputRef = useRef<HTMLInputElement | null>(null);
  const activeItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const suppressParamSyncRef = useRef(false);
  const visibleResults = results.slice(0, 7);
  const showResults = open && query.trim().length >= MIN_QUERY_LENGTH;
  const capsuleClass =
    'overflow-hidden rounded-full border border-white/45 bg-white/34 shadow-[0_12px_36px_rgba(20,37,45,0.16)] ring-1 ring-black/5 backdrop-blur-xl';
  const expandedCapsuleClass =
    'overflow-hidden rounded-t-[26px] rounded-b-[1.85rem] border border-white/45 bg-white/34 shadow-[0_12px_36px_rgba(20,37,45,0.16)] ring-1 ring-black/5 backdrop-blur-xl';

  function focusActiveInput() {
    const target = showResults ? expandedInputRef.current : collapsedInputRef.current;
    if (!target) return;
    target.focus();
    const end = target.value.length;
    target.setSelectionRange(end, end);
  }

  useEffect(() => {
    if (suppressParamSyncRef.current && !homeSearchParam && !homeFocusParam) {
      suppressParamSyncRef.current = false;
      return;
    }
    setQuery(homeSearchParam);
  }, [homeFocusParam, homeSearchParam]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    function handleFocusRequest() {
      const target = showResults ? expandedInputRef.current : collapsedInputRef.current;
      if (!target) return;
      target.focus();
      const end = target.value.length;
      target.setSelectionRange(end, end);
    }

    window.addEventListener('home-hero-search-focus', handleFocusRequest);
    return () => {
      window.removeEventListener('home-hero-search-focus', handleFocusRequest);
    };
  }, [showResults]);

  useEffect(() => {
    if (!open) {
      setIsFocused(false);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    async function run() {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        const data = await response.json();
        if (cancelled) return;

        const nextResults = (data.results ?? []) as Result[];
        setResults(nextResults);
        setActiveIndex(nextResults.length > 0 ? 0 : -1);

        const normalizedQuery = trimmedQuery.toLowerCase();
        if (
          trimmedQuery.length >= MIN_QUERY_LENGTH &&
          nextResults.length === 0 &&
          !trackedNoResultQueries.current.has(normalizedQuery)
        ) {
          trackedNoResultQueries.current.add(normalizedQuery);
          trackEvent('search_no_results', {
            query: trimmedQuery,
            source: 'home_hero_search',
            page_path: window.location.pathname,
          });
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setActiveIndex(-1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(run, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!showResults || activeIndex < 0) return;
    const activeItem = activeItemRefs.current[activeIndex];
    if (!activeItem) return;
    activeItem.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, showResults]);

  useEffect(() => {
    if (!isFocused) return;

    const frame = window.requestAnimationFrame(() => {
      const target = showResults ? expandedInputRef.current : collapsedInputRef.current;
      if (!target) return;
      target.focus();
      const end = target.value.length;
      target.setSelectionRange(end, end);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isFocused, showResults]);

  function navigateTo(result: Result) {
    if (result.type === 'protocolo') {
      trackEvent('protocol_open', {
        protocol_title: result.title,
        protocol_url: result.url,
        source: 'home_hero_search',
        page_path: window.location.pathname,
      });
    }

    setOpen(false);

    if (result.url.startsWith('/')) {
      router.push(result.url);
      return;
    }

    window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  function clearHomeHighlight() {
    if (!homeSearchParam && !homeFocusParam) return;
    suppressParamSyncRef.current = true;
    router.replace(pathname, { scroll: false });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!visibleResults.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current < visibleResults.length - 1 ? current + 1 : current));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current > 0 ? current - 1 : 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selectedResult = visibleResults[activeIndex] ?? visibleResults[0];
      if (selectedResult) {
        navigateTo(selectedResult);
      }
    }
  }

  const searchRow = (variant: 'collapsed' | 'expanded') => (
    <div className="relative flex items-center gap-3 px-4 py-2.5 md:px-5 md:py-2.5">
      <span aria-hidden className="shrink-0 text-[#2f6673]">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        ref={variant === 'expanded' ? expandedInputRef : collapsedInputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setIsFocused(true);
          clearHomeHighlight();
          setOpen(true);
        }}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Introduce un término de búsqueda"
        aria-label="Buscar en UrgenciasHSJ"
        className="min-w-0 flex-1 bg-transparent text-[16px] font-normal text-slate-900 outline-none placeholder:text-slate-500 md:text-[15px] md:placeholder:text-transparent"
      />
      <span
        className={`pointer-events-none absolute top-1/2 left-11 right-12 hidden -translate-y-1/2 truncate text-left text-[15px] text-slate-500 md:block ${
          isFocused || query ? 'opacity-0' : 'opacity-100'
        }`}
      >
        Busca un protocolo, escala, recurso o lo que quieras dentro de la web
      </span>
      <button
        type="button"
        onClick={() => {
          if (!query) return;
          setQuery('');
          setResults([]);
          setOpen(false);
          setActiveIndex(-1);
          setIsFocused(true);
          window.requestAnimationFrame(() => {
            focusActiveInput();
          });
        }}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-500 transition ${
          query
            ? 'border-white/35 bg-white/22 hover:border-white/65 hover:bg-white/42 hover:text-[#2f6673]'
            : 'pointer-events-none border-transparent bg-transparent opacity-0'
        }`}
        aria-label="Limpiar búsqueda"
        tabIndex={query ? 0 : -1}
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );

  return (
    <div ref={rootRef} className="relative mt-18 w-full max-w-[52rem]">
      <div className={`relative z-20 ${capsuleClass} ${showResults ? 'border-b-transparent' : ''}`}>
        {searchRow('collapsed')}
      </div>

      {showResults ? (
        <div className={`absolute inset-x-0 top-0 z-30 ${expandedCapsuleClass}`}>
          {searchRow('expanded')}
          <div className="max-h-[min(55vh,28rem)] overflow-auto px-2 pb-2 pt-1.5">
            {loading ? (
              <div className="px-3 py-4 text-sm text-[#516f75]">Buscando…</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#516f75]">Sin resultados</div>
            ) : (
              <ul className="space-y-1">
                {visibleResults.map((result, index) => (
                  <li key={`${result.type}-${result.url}-${index}`}>
                    <button
                      ref={(element) => {
                        activeItemRefs.current[index] = element;
                      }}
                      type="button"
                      onClick={() => navigateTo(result)}
                      className={`block w-full rounded-[1rem] px-3.5 py-3 text-left transition ${
                        index === activeIndex
                          ? 'bg-[#dcebee]/95 shadow-[inset_0_0_0_1px_rgba(43,93,104,0.12)]'
                          : 'hover:bg-white/72'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-full border border-[#d5e4e8] bg-white/72 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#587079]">
                          {getTypeLabel(result.type)}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium text-slate-900">
                          {result.title}
                        </span>
                      </div>
                      {result.snippet ? (
                        <div className="mt-1 text-xs text-[#6b7f83]">{result.snippet}</div>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
