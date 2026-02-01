'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CountsState = {
  pendientesIngreso: string;
  pendientesEvolucion: string;
  pendientesMedico: string;
  observacionPendientesUbicacion: string;
};

const DEFAULT_COUNTS: CountsState = {
  pendientesIngreso: '0',
  pendientesEvolucion: '0',
  pendientesMedico: '0',
  observacionPendientesUbicacion: '0',
};

const COUNT_FIELDS: { key: keyof CountsState; label: string }[] = [
  { key: 'pendientesIngreso', label: 'Pendientes de ingreso' },
  { key: 'pendientesEvolucion', label: 'Pendientes de evolución' },
  { key: 'pendientesMedico', label: 'Pendientes de asistencia' },
  { key: 'observacionPendientesUbicacion', label: 'Observación urgencias' },
];

const PRUEBAS_OPCIONES = ['ECO', 'TAC', 'Endoscopia', 'EEG', 'Otras'] as const;

const ESPECIALIDADES = [
  { label: 'Anestesia', abbr: 'ANE' },
  { label: 'Cardiología', abbr: 'CAR' },
  { label: 'Cirugía General', abbr: 'CGD' },
  { label: 'Cirugía Maxilofacial', abbr: 'CMX' },
  { label: 'Digestivo', abbr: 'DIG' },
  { label: 'Endocrino', abbr: 'ECR' },
  { label: 'Ginecología', abbr: 'GIN' },
  { label: 'Infecciosas', abbr: 'UEI' },
  { label: 'Neumología', abbr: 'NEM' },
  { label: 'Neurología', abbr: 'NER' },
  { label: 'Oftalmología', abbr: 'OFT' },
  { label: 'ORL', abbr: 'ORL' },

  { label: 'Pediatría', abbr: 'PED' },
  { label: 'Preventiva', abbr: 'PRV' },
  { label: 'Psiquiatría', abbr: 'PSQ' },
  { label: 'Traumatología', abbr: 'COT' },
  { label: 'Trabajadora Social', abbr: 'TSO' },
  { label: 'UHD', abbr: 'UHD' },
  { label: 'Urología', abbr: 'URO' },
  { label: 'Otra', abbr: '' },
] as const;

type PruebaKey = (typeof PRUEBAS_OPCIONES)[number];
type PruebaState = Record<PruebaKey, { activo: boolean; cantidad: string; custom?: string }>;

type EspecialidadRow = {
  id: string;
  label: string;
  abbr: string;
  customLabel: string;
  customAbbr: string;
  cantidad: string;
};

const getYesterdayDateValue = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
};

const STORAGE_KEY = 'parte-jefatura-form';

const isAppleMobile = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
};

export default function ParteJefaturaPage() {
  const [fecha, setFecha] = useState(getYesterdayDateValue);
  const [jefeGuardia, setJefeGuardia] = useState('');
  const [incidenciasHtml, setIncidenciasHtml] = useState('');
  const [conteos, setConteos] = useState<CountsState>(DEFAULT_COUNTS);
  const [pruebas, setPruebas] = useState<PruebaState>(() =>
    PRUEBAS_OPCIONES.reduce(
      (acc, key) => ({ ...acc, [key]: { activo: true, cantidad: '0' } }),
      {} as PruebaState
    )
  );
  const [especialidades, setEspecialidades] = useState<EspecialidadRow[]>([
    { id: 'esp-1', label: '', abbr: '', customLabel: '', customAbbr: '', cantidad: '0' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailSending, setMailSending] = useState(false);
  const [mailError, setMailError] = useState('');
  const [mailSuccess, setMailSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const openGuardRef = useRef(false);
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    color: '#000000',
  });

  const isValid = useMemo(() => {
    return fecha.trim().length > 0 && jefeGuardia.trim().length > 0;
  }, [fecha, jefeGuardia]);

  const updateCount = (key: keyof CountsState, value: string) => {
    setConteos((prev) => ({ ...prev, [key]: value }));
  };

  const clampNumber = (value: number) => Math.max(0, Math.min(999, value));

  const adjustValue = (value: string, delta: number) => {
    const n = Number.parseInt(value || '0', 10);
    const next = clampNumber(Number.isNaN(n) ? 0 : n + delta);
    return String(next);
  };

  const renderNumberInput = (
    value: string,
    onChange: (next: string) => void,
    ariaLabel: string
  ) => (
    <div className="flex w-full overflow-hidden rounded border border-slate-300">
      <input
        type="number"
        min={0}
        max={999}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 px-3 py-2 text-sm focus:outline-none"
        aria-label={ariaLabel}
      />
      <div className="flex w-16 flex-nowrap items-stretch bg-slate-100">
        <button
          type="button"
          onClick={() => onChange(adjustValue(value, 1))}
          className="flex h-full w-8 items-center justify-center border-l border-slate-300 text-base font-semibold leading-none hover:bg-slate-200"
          aria-label={`${ariaLabel} aumentar`}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onChange(adjustValue(value, -1))}
          className="flex h-full w-8 items-center justify-center border-l border-slate-300 text-base font-semibold leading-none hover:bg-slate-200"
          aria-label={`${ariaLabel} disminuir`}
        >
          −
        </button>
      </div>
    </div>
  );

  const updatePruebaCantidad = (key: PruebaKey, value: string) => {
    setPruebas((prev) => ({
      ...prev,
      [key]: { ...prev[key], cantidad: value },
    }));
  };

  const addEspecialidad = () => {
    setEspecialidades((prev) => [
      ...prev,
      {
        id: `esp-${Date.now()}-${prev.length}`,
        label: '',
        abbr: '',
        customLabel: '',
        customAbbr: '',
        cantidad: '0',
      },
    ]);
  };

  const updateEspecialidad = (id: string, patch: Partial<EspecialidadRow>) => {
    setEspecialidades((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeEspecialidad = (id: string) => {
    setEspecialidades((prev) => prev.filter((row) => row.id !== id));
  };

  const saveSelection = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range;
      updateFormatState();
    }
  };

  const restoreSelection = () => {
    const range = selectionRef.current;
    const selection = document.getSelection();
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const applyEditorCommand = (command: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
    }
    document.execCommand(command);
    if (editorRef.current) {
      setIncidenciasHtml(editorRef.current.innerHTML);
      updateFormatState();
    }
  };

  const applyEditorColor = (color: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
    }
    document.execCommand('foreColor', false, color);
    if (editorRef.current) {
      setIncidenciasHtml(editorRef.current.innerHTML);
      updateFormatState();
    }
  };

  const updateFormatState = () => {
    if (!editorRef.current) return;
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    const bold = document.queryCommandState('bold');
    const italic = document.queryCommandState('italic');
    const underline = document.queryCommandState('underline');
    const colorValue = String(document.queryCommandValue('foreColor') || '').toLowerCase();
    const color =
      colorValue.includes('b91c1c') || colorValue.includes('185, 28, 28')
        ? '#b91c1c'
        : colorValue.includes('1d4ed8') || colorValue.includes('29, 78, 216')
          ? '#1d4ed8'
          : '#000000';

    setFormatState({ bold, italic, underline, color });
  };

  useEffect(() => {
    const handler = () => updateFormatState();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setIncidenciasHtml(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        fecha?: string;
        jefeGuardia?: string;
        incidenciasHtml?: string;
        conteos?: CountsState;
        pruebas?: PruebaState;
        especialidades?: EspecialidadRow[];
      };
      if (saved.fecha) setFecha(saved.fecha);
      if (saved.jefeGuardia) setJefeGuardia(saved.jefeGuardia);
      if (saved.incidenciasHtml) setIncidenciasHtml(saved.incidenciasHtml);
      if (saved.conteos) setConteos(saved.conteos);
      if (saved.pruebas) setPruebas(saved.pruebas);
      if (saved.especialidades) setEspecialidades(saved.especialidades);
      if (editorRef.current && saved.incidenciasHtml) {
        editorRef.current.innerHTML = saved.incidenciasHtml;
      }
    } catch {
      // ignore restore errors
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!isValid) {
      setError('Completa la fecha y el jefe de guardia.');
      return;
    }

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fecha,
          jefeGuardia,
          incidenciasHtml,
          conteos,
          pruebas,
          especialidades,
        })
      );
    } catch {
      // ignore storage errors
    }

    if (isAppleMobile()) {
      const payload = {
        fecha,
        jefeGuardia,
        pruebas: PRUEBAS_OPCIONES.map((key) => ({
          tipo: key === 'Otras' ? pruebas[key].custom || 'Otras' : key,
          cantidad: pruebas[key].cantidad,
        })),
        especialidades: especialidades.map((row) => ({
          tipo: row.label === 'Otra' ? row.customAbbr || row.customLabel : row.abbr || row.label,
          cantidad: row.cantidad,
        })),
        incidenciasHtml,
        ...conteos,
        download: true,
      };

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/parte-jefatura';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify(payload);
      form.appendChild(input);

      const downloadInput = document.createElement('input');
      downloadInput.type = 'hidden';
      downloadInput.name = 'download';
      downloadInput.value = '1';
      form.appendChild(downloadInput);

      document.body.appendChild(form);
      form.submit();
      form.remove();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/parte-jefatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          jefeGuardia,
          pruebas: PRUEBAS_OPCIONES.map((key) => ({
            tipo: key === 'Otras' ? pruebas[key].custom || 'Otras' : key,
            cantidad: pruebas[key].cantidad,
          })),
          especialidades: especialidades.map((row) => ({
            tipo: row.label === 'Otra' ? row.customAbbr || row.customLabel : row.abbr || row.label,
            cantidad: row.cantidad,
          })),
          incidenciasHtml,
          ...conteos,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'No se pudo generar el PDF.');
      }

      if (openGuardRef.current) return;
      openGuardRef.current = true;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = 'parte-jefatura.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        openGuardRef.current = false;
      }, 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = async () => {
    setMailError('');
    setMailSuccess(false);
    if (!isValid) {
      setMailError('Completa la fecha y el jefe de la guardia.');
      return;
    }
    if (!mailTo.trim()) {
      setMailError('Introduce un email válido.');
      return;
    }
    setMailSending(true);
    try {
      const res = await fetch('/api/parte-jefatura/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mailTo.trim(),
          fecha,
          jefeGuardia,
          pruebas: PRUEBAS_OPCIONES.map((key) => ({
            tipo: key === 'Otras' ? pruebas[key].custom || 'Otras' : key,
            cantidad: pruebas[key].cantidad,
          })),
          especialidades: especialidades.map((row) => ({
            tipo: row.label === 'Otra' ? row.customAbbr || row.customLabel : row.abbr || row.label,
            cantidad: row.cantidad,
          })),
          incidenciasHtml,
          ...conteos,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'No se pudo enviar el email.');
      }
      setMailSuccess(true);
      setTimeout(() => {
        setMailOpen(false);
        setMailSuccess(false);
      }, 1200);
    } catch (err) {
      setMailError(err instanceof Error ? err.message : 'Error enviando email.');
    } finally {
      setMailSending(false);
    }
  };

  const resetForm = () => {
    const ok = window.confirm('¿Quieres borrar los datos y volver a los valores por defecto?');
    if (!ok) return;
    setFecha(getYesterdayDateValue());
    setJefeGuardia('');
    setIncidenciasHtml('');
    setConteos(DEFAULT_COUNTS);
    setPruebas(
      PRUEBAS_OPCIONES.reduce(
        (acc, key) => ({ ...acc, [key]: { activo: true, cantidad: '0' } }),
        {} as PruebaState
      )
    );
    setEspecialidades([{ id: 'esp-1', label: '', abbr: '', customLabel: '', customAbbr: '', cantidad: '0' }]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Parte de Jefatura</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 prevent-ios-zoom">
        <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
          <label className="space-y-1 text-sm">
            <span className="text-sm font-semibold text-slate-700">
              Fecha <span className="text-red-600">*</span>
            </span>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-10 rounded border border-slate-300 bg-white px-3 text-sm appearance-none date-input"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-sm font-semibold text-slate-700">
              Jefe de la guardia <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              required
              value={jefeGuardia}
              onChange={(e) => setJefeGuardia(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Nombre y apellidos"
            />
          </label>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Pruebas radiológicas</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-[repeat(4,minmax(0,1fr))]">
            {PRUEBAS_OPCIONES.map((key) => (
              <div
                key={key}
                className={`grid gap-2 ${key === 'Otras' ? 'col-span-2 sm:col-span-2' : ''}`}
              >
                <label className="text-sm font-semibold text-slate-700">{key}</label>
                {key === 'Otras' ? (
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-2">
                    {renderNumberInput(
                      pruebas[key].cantidad,
                      (next) => updatePruebaCantidad(key, next),
                      `${key} cantidad`
                    )}
                    <input
                      type="text"
                      value={pruebas[key].custom || ''}
                      onChange={(e) =>
                        setPruebas((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], custom: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Especifica prueba"
                    />
                  </div>
                ) : (
                  renderNumberInput(
                    pruebas[key].cantidad,
                    (next) => updatePruebaCantidad(key, next),
                    `${key} cantidad`
                  )
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Valoración por especialidad</h2>
          <div className="space-y-3">
            {especialidades.map((row, index) => (
              <div key={row.id} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <div className="space-y-2">
                  <select
                    value={row.label}
                    onChange={(e) => {
                      const selected = ESPECIALIDADES.find((esp) => esp.label === e.target.value);
                      updateEspecialidad(row.id, {
                        label: selected?.label ?? '',
                        abbr: selected?.abbr ?? '',
                      });
                    }}
                    className="w-full h-10 rounded border border-slate-300 bg-white px-3 text-sm appearance-none"
                  >
                    <option value="">Selecciona especialidad</option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp.label} value={esp.label}>
                        {esp.label}
                      </option>
                    ))}
                  </select>
                  {row.label === 'Otra' && (
                    <input
                      type="text"
                      value={row.customLabel}
                      onChange={(e) => updateEspecialidad(row.id, { customLabel: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Especifica especialidad"
                    />
                  )}
                  {row.label === 'Otra' && (
                    <input
                      type="text"
                      value={row.customAbbr}
                      onChange={(e) => updateEspecialidad(row.id, { customAbbr: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Abreviatura (ej. CAR)"
                    />
                  )}
                </div>
                {renderNumberInput(
                  row.cantidad,
                  (next) => updateEspecialidad(row.id, { cantidad: next }),
                  `Cantidad ${row.label || 'especialidad'}`
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addEspecialidad}
                    className="rounded bg-slate-200 px-3 py-2 text-sm"
                  >
                    +
                  </button>
                  {especialidades.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEspecialidad(row.id)}
                      className="rounded border border-slate-300 px-3 py-2 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Nº Pacientes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {COUNT_FIELDS.map((field) => (
              <label key={field.key} className="space-y-1 text-sm">
                <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                {renderNumberInput(
                  conteos[field.key],
                  (next) => updateCount(field.key, next),
                  field.label
                )}
              </label>
            ))}
          </div>
        </section>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Incidencias</span>
          <div className="w-full rounded border border-slate-300">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1 text-sm">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyEditorCommand('bold')}
                className={`h-8 w-8 rounded border border-slate-300 ${
                  formatState.bold ? 'bg-slate-200' : ''
                }`}
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyEditorCommand('italic')}
                className={`h-8 w-8 rounded border border-slate-300 italic ${
                  formatState.italic ? 'bg-slate-200' : ''
                }`}
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyEditorCommand('underline')}
                className={`h-8 w-8 rounded border border-slate-300 underline ${
                  formatState.underline ? 'bg-slate-200' : ''
                }`}
              >
                U
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyEditorColor('#000000')}
                className={`h-8 w-8 rounded border border-slate-300 ${
                  formatState.color === '#000000' ? 'bg-slate-200' : ''
                }`}
                aria-label="Texto negro"
                title="Negro"
              >
                <span className="block h-4 w-4 rounded-full bg-black mx-auto" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyEditorColor('#b91c1c')}
                className={`h-8 w-8 rounded border border-slate-300 ${
                  formatState.color === '#b91c1c' ? 'bg-slate-200' : ''
                }`}
                aria-label="Texto rojo"
                title="Rojo"
              >
                <span className="block h-4 w-4 rounded-full bg-red-700 mx-auto" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyEditorColor('#1d4ed8')}
                className={`h-8 w-8 rounded border border-slate-300 ${
                  formatState.color === '#1d4ed8' ? 'bg-slate-200' : ''
                }`}
                aria-label="Texto azul"
                title="Azul"
              >
                <span className="block h-4 w-4 rounded-full bg-blue-700 mx-auto" />
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              className="min-h-[160px] w-full px-3 py-2 text-sm focus:outline-none"
              role="textbox"
              aria-label="Incidencias"
              suppressContentEditableWarning
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Generando...' : 'Generar PDF'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isValid) {
                  setError('Completa la fecha y el jefe de la guardia.');
                  return;
                }
                setMailError('');
                setMailOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
            >
              Enviar por mail
            </button>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          >
            Borrar
          </button>
        </div>
      </form>

      {mailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Enviar por mail</h2>
            <p className="mt-1 text-sm text-slate-600">
              Se enviará el PDF como adjunto.
            </p>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Email destino
            </label>
            <input
              type="email"
              value={mailTo}
              onChange={(e) => setMailTo(e.target.value)}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="nombre@dominio.com"
            />
            {mailError && <p className="mt-2 text-sm text-red-600">{mailError}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMailOpen(false)}
                className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 hover:border-slate-400"
              >
                Cancelar
              </button>
            <button
              type="button"
              onClick={handleSendMail}
              disabled={mailSending || mailSuccess}
              className={`rounded px-3 py-2 text-sm text-white disabled:opacity-60 ${
                mailSuccess ? 'bg-emerald-600' : 'bg-slate-900'
              } ${mailSuccess ? '' : 'hover:bg-slate-800'}`}
            >
              {mailSending ? 'Enviando...' : mailSuccess ? 'Enviado!' : 'Enviar'}
            </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
