"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import InformeCopiable from "@/components/InformeCopiable";
import ResourceSearchHeader from "@/components/ResourceSearchHeader";
import HeaderSearchInput from "@/components/HeaderSearchInput";
import { FilterButton, SiteButton } from "@/components/ui/SiteButton";
import { matchesMacroSearch, normalizeMacroSearch as norm, type MacroCatalogItem as ItemCatalogo } from "@/lib/macroSearch";
import styles from "./Macros.module.css";

function DietasContenido() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [q, setQ] = useState("");
  const [fSistema, setFSistema] = useState("");
  const [seleccion, setSeleccion] = useState<ItemCatalogo | null>(null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const requestId = useRef(0);
  const viewerRef = useRef<HTMLHeadingElement>(null);
  const [errorTexto, setErrorTexto] = useState(false);
  const [catalogoEstado, setCatalogoEstado] = useState("cargando");

  useEffect(() => {
    fetch("/api/macros")
      .then((r) => {
        if (!r.ok) throw new Error("catalogo");
        return r.json();
      })
      .then((data: unknown) => {
        setCatalogo(Array.isArray(data) ? (data as ItemCatalogo[]) : []);
        setCatalogoEstado("listo");
      })
      .catch(() => setCatalogoEstado("error"));
  }, []);

  const filtrados = useMemo(() => {
    const nq = norm(q).trim();
    const base = fSistema
      ? catalogo.filter((it) => (it.sistemas || []).includes(fSistema))
      : catalogo;
    if (!nq) return base;

    return base.filter((it) => matchesMacroSearch(it, nq));
  }, [catalogo, q, fSistema]);

  const sistemas = useMemo(() => {
    const set = new Set<string>();
    catalogo.forEach((it) => {
      (it.sistemas || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [catalogo]);

  const cargar = useCallback(async (it: ItemCatalogo) => {
    const currentRequest = ++requestId.current;
    setSeleccion(it);
    setErrorTexto(false);
    setCargando(true);
    setTexto("");

    try {
      const r = await fetch(it.ruta, { cache: "no-store" });
      if (!r.ok) throw new Error("texto");
      const t = await r.text();
      if (currentRequest === requestId.current) setTexto(t.trim());
    } catch {
      if (currentRequest === requestId.current) setErrorTexto(true);
    } finally {
      if (currentRequest === requestId.current) setCargando(false);
    }
  }, []);

  const clearSelectedId = useCallback(() => {
    if (!searchParams.get("id")) return;
    router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  const selectedId = searchParams.get("id") ?? "";

  useEffect(() => {
    if (!selectedId || !catalogo.length) return;
    const target = catalogo.find(
      (it) => norm(it.id) === norm(selectedId) || norm(it.titulo) === norm(selectedId)
    );
    if (target && target.id !== seleccion?.id) {
      void cargar(target);
    }
  }, [catalogo, selectedId, seleccion?.id, cargar]);

  useEffect(() => {
    if (seleccion && window.matchMedia("(max-width: 1023px)").matches) {
      viewerRef.current?.focus();
      viewerRef.current?.scrollIntoView({ block: "start" });
    }
  }, [seleccion]);

  function volver() {
    ++requestId.current;
    clearSelectedId();
    setSeleccion(null);
    setTexto("");
    setCargando(false);
    setErrorTexto(false);
    window.requestAnimationFrame(() => document.getElementById("macros-search")?.focus());
  }

  return (
    <div className={styles.page}>
      <div className={seleccion ? styles.hideOnMobile : undefined}>
      <ResourceSearchHeader
        title="Macros"
        badge="Textos clínicos"
        description="Busca por título o palabras clave, o filtra por sistema, para encontrar y copiar el texto que necesitas."
        stats={
          <>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 backdrop-blur-sm">{catalogo.length} macros</span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 backdrop-blur-sm">{new Set(catalogo.flatMap((item) => item.sistemas || [])).size} sistemas</span>
            {(q.trim() || fSistema) && <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 backdrop-blur-sm">{filtrados.length} resultados</span>}
          </>
        }
      >
        <HeaderSearchInput
          id="macros-search"
          label="Buscar macros"
          placeholder="Buscar por título, sistema o palabra clave"
          value={q}
          onChange={setQ}
        />
      </ResourceSearchHeader>
      </div>

      <section className={`${styles.filters} ${seleccion ? styles.hideOnMobile : ""}`} aria-label="Filtrar macros por sistema">
        <div className={styles.filterHeading}>
          <SiteButton
            style={{ visibility: q || fSistema ? "visible" : "hidden" }}
            disabled={!q && !fSistema}
            tabIndex={q || fSistema ? 0 : -1}
            onClick={() => { setQ(""); setFSistema(""); }}
          >
            Limpiar filtros
          </SiteButton>
        </div>
        <div className={styles.filterButtons}>
          <FilterButton active={!fSistema} filtering={Boolean(q.trim() || fSistema)} count={catalogo.length} onClick={() => setFSistema("")}>Todos</FilterButton>
          {sistemas.map((s) => (
            <FilterButton key={s} active={fSistema === s} filtering={Boolean(q.trim() || fSistema)} count={catalogo.filter((it) => it.sistemas?.includes(s)).length} onClick={() => setFSistema(fSistema === s ? "" : s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </FilterButton>
          ))}
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={`${styles.catalogue} ${seleccion ? styles.hideOnMobile : ""}`} aria-label="Catálogo de macros">
          <div className={styles.catalogueHeading}>
            <h2>Textos disponibles</h2>
            <span aria-live="polite">{filtrados.length} resultados</span>
          </div>
          <div className={styles.list}>
            {[...filtrados].sort((a, b) => a.titulo.localeCompare(b.titulo, "es")).map((it) => (
              <button key={it.id} type="button" className={styles.item} aria-pressed={seleccion?.id === it.id} onClick={() => { clearSelectedId(); void cargar(it); }}>
                <span className={styles.itemTitle}>{it.titulo}</span>
                <span className={styles.itemMeta}>{(it.sistemas || []).join(" · ") || "General"}</span>
                {seleccion?.id === it.id && <span className={styles.selectedMark} aria-hidden="true">✓</span>}
              </button>
            ))}
            {catalogoEstado === "cargando" && <p className={styles.listMessage} role="status">Cargando macros…</p>}
            {catalogoEstado === "error" && <p className={styles.listMessage} role="alert">No se pudo cargar el catálogo. Recarga la página para volver a intentarlo.</p>}
            {catalogoEstado === "listo" && !filtrados.length && <div className={styles.listMessage}><h3>No hay coincidencias</h3><p>Prueba con otra palabra o selecciona otro sistema.</p><SiteButton onClick={() => { setQ(""); setFSistema(""); }}>Ver todas las macros</SiteButton></div>}
          </div>
        </section>

        <section className={`${styles.viewer} ${!seleccion ? styles.emptyOnMobile : ""}`} aria-label="Contenido de la macro" aria-busy={cargando}>
          {seleccion ? (
            <>
              <div className={styles.viewerHeading}>
                <SiteButton className={styles.back} onClick={volver}>Volver a resultados</SiteButton>
                <p className={styles.eyebrow}>Texto para copiar</p>
                <h2 ref={viewerRef} tabIndex={-1}>{seleccion.titulo}</h2>
                <p className={styles.itemMeta}>{(seleccion.sistemas || []).join(" · ")}</p>
              </div>
              {cargando && <p className={styles.listMessage} role="status">Cargando texto…</p>}
              {errorTexto && <div className={styles.listMessage} role="alert"><p>No se pudo cargar el texto.</p><SiteButton onClick={() => void cargar(seleccion)}>Volver a intentar</SiteButton></div>}
              {!cargando && !errorTexto && texto && <div className={styles.document}><InformeCopiable key={seleccion.id} texto={texto} /></div>}
              {!cargando && !errorTexto && !texto && <p className={styles.listMessage}>Esta macro no contiene texto.</p>}
            </>
          ) : (
            <div className={styles.empty}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
              <h2>Selecciona una macro</h2>
              <p>Consulta el texto y cópialo para incorporarlo a tu informe.</p>
              <span>Busca por nombre o explora los sistemas del catálogo.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DietasYRecomendaciones() {
  return (
    <Suspense fallback={<div className="space-y-6">Cargando…</div>}>
      <DietasContenido />
    </Suspense>
  );
}
