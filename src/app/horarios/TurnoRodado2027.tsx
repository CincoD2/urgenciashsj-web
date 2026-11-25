'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Script from 'next/script';

const base = '/horarios/2027';
const groups = [1, 2, 3, 4, 5, 6];
const counts = [196, 197, 193, 193, 195, 196];

function Icon({ kind }: { kind: 'download' | 'mail' | 'calendar' }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === 'download' ? (
        <>
          <path d="M12 3v12m-5-5 5 5 5-5" />
          <path d="M4 16v5h16v-5" />
        </>
      ) : kind === 'mail' ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 6 9 7 9-7" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 11h18m-14 4h1m4 0h1m4 0h1m-11 3h1m4 0h1" />
        </>
      )}
    </svg>
  );
}
const linkClass =
  'inline-flex items-center justify-center rounded-xl border border-[#c7dadd] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f4c57] transition hover:bg-[#edf5f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4c57]';

export default function TurnoRodado2027() {
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(0);
  const instructions = useRef<HTMLDialogElement>(null);
  const holidays = useRef<HTMLDialogElement>(null);
  const [holidaysOpen, setHolidaysOpen] = useState(false);

  function closeHolidays() {
    holidays.current?.close();
    setHolidaysOpen(false);
  }
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  function closeInstructions() {
    instructions.current?.close();
    setInstructionsOpen(false);
  }

  useEffect(() => {
    if (group === null && !instructionsOpen && !holidaysOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [group, instructionsOpen, holidaysOpen]);

  function openMail(g: number) {
    requestId.current += 1;
    setGroup(g);
    setEmail('');
    setWebsite('');
    setNotice('');
    setError(false);
    setSending(false);
    setSent(false);
    dialog.current?.showModal();
  }

  function closeMail() {
    requestId.current += 1;
    dialog.current?.close();
    setGroup(null);
  }
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || group === null) return;
    const currentRequest = requestId.current;
    setSending(true);
    setNotice('');
    setError(false);
    try {
      const recaptchaToken =
        siteKey && window.grecaptcha?.execute
          ? await window.grecaptcha.execute(siteKey, { action: 'turno_2027_mail' })
          : '';
      const response = await fetch('/api/horarios/2027/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, group: String(group), website, recaptchaToken }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || 'No se pudo enviar el correo. Puedes descargar los archivos directamente.'
        );
      if (currentRequest !== requestId.current) return;
      setSent(true);
      setNotice(
        'Correo enviado. Revisa tu bandeja de entrada y, si no aparece, la carpeta de correo no deseado.'
      );
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(true);
      setNotice(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el correo. Prueba la descarga directa.'
      );
    } finally {
      if (currentRequest === requestId.current) setSending(false);
    }
  }

  return (
    <section
      aria-labelledby="turno-2027-title"
      className="space-y-6 rounded-2xl border border-[#dfe9eb] bg-[#f6f9fa] p-5 sm:p-7"
    >
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#52747d]">
          Calendario por grupos · 2027
        </p>
        <h3 id="turno-2027-title" className="text-2xl font-semibold text-[#1f4c57]">
          Turno rodado
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
          Distribución 2027 desde el 11 de enero al 23 de diciembre de 2027. La rueda se repite cada
          6 semanas (42 días), con una semana de desfase entre los seis grupos. NO SE INCLUYEN LOS
          REFUERZOS (R).El damero y los calendarios{' '}
          <button
            type="button"
            onClick={() => {
              setHolidaysOpen(true);
              holidays.current?.showModal();
            }}
            aria-haspopup="dialog"
            className="cursor-pointer rounded-sm font-medium text-[#1f4c57] underline decoration-[#8baeb5] underline-offset-4 hover:decoration-[#1f4c57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4c57]"
          >
            incluyen las asignaciones especiales de los festivos
          </button>
          .
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
          {[
            ['M', '08:00–15:00'],
            ['T', '15:00–22:00'],
            ['D', '08:00–22:00'],
            ['N', '20:00–08:00'],
            ['TN', '15:00–08:00'],
          ].map(([code, hours]) => (
            <div key={code} className="flex gap-1.5">
              <dt className="font-semibold">{code}</dt>
              <dd>{hours}</dd>
            </div>
          ))}
        </dl>

        <p className="text-xs text-slate-600">
          Los días libres no generan eventos. Horarios de Madrid, con ajuste al horario de verano.
          Sin recordatorios añadidos.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={`${base}/damero-urgencias-2027.pdf`}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          Ver damero anual en PDF
        </a>
      </div>
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-600">
          Añade los turnos de tu grupo a tu calendario. Antes de descargar o solicitar el archivo,{' '}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              setInstructionsOpen(true);
              instructions.current?.showModal();
            }}
            className="cursor-pointer rounded-sm font-medium text-[#1f4c57] underline decoration-[#8baeb5] underline-offset-4 hover:decoration-[#1f4c57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4c57]"
          >
            consulta las instrucciones para importar el calendario de tu grupo en tu Android, iPhone
            o Mac
          </button>
          .
        </p>
      </div>
      <div className="space-y-3">
        <h4 className="font-semibold text-[#1f4c57]">Elige tu grupo</h4>
        <ul className="divide-y divide-[#dfe9eb] rounded-xl border border-[#dfe9eb] bg-white px-4 sm:px-5">
          {groups.map((g) => (
            <li key={g} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <span className="text-[#52747d]">
                  <Icon kind="calendar" />
                </span>
                <div>
                  <p className="font-semibold text-[#1f4c57]">Grupo {g}</p>
                  <p className="text-sm text-slate-500">{counts[g - 1]} turnos programados</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`${base}/urgencias-2027-grupo-${g}.ics`}
                  download
                  aria-label={`Descargar ICS del grupo ${g}`}
                  className={`${linkClass} gap-2`}
                >
                  <Icon kind="download" />
                  Descargar .ics
                </a>
                <button
                  type="button"
                  onClick={() => openMail(g)}
                  aria-label={`Enviar por correo el grupo ${g}`}
                  className={`${linkClass} gap-2`}
                >
                  <Icon kind="mail" />
                  Enviar por mail
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="mail-2027-title"
        aria-describedby="mail-2027-description"
        onCancel={(event) => {
          event.preventDefault();
          closeMail();
        }}
        onClose={() => {
          requestId.current += 1;
          setGroup(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMail();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[#dfe9eb] bg-white p-0 text-slate-700 shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="p-5 sm:p-6">
          <div className={sent ? 'sr-only' : 'mb-3 flex items-start justify-between gap-3'}>
            <h4 id="mail-2027-title" className="text-xl font-semibold text-[#1f4c57]">
              {sent ? 'Correo enviado' : `Enviar calendario · Grupo ${group}`}
            </h4>
            <button
              type="button"
              tabIndex={sent ? -1 : undefined}
              onClick={closeMail}
              aria-label="Cerrar"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            >
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          {sent ? (
            <div className="space-y-5">
              <p id="mail-2027-description" role="status" className="text-sm leading-relaxed">
                {notice}
              </p>
              <button
                type="button"
                autoFocus
                onClick={closeMail}
                className="w-full rounded-xl bg-[#1f4c57] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b6572]"
              >
                Aceptar
              </button>
            </div>
          ) : (
            <>
              <p id="mail-2027-description" className="mb-4 text-sm">
                Recibirás el archivo ICS de este grupo como adjunto.
              </p>
              <form onSubmit={send} className="space-y-4">
                <label className="block space-y-1 text-sm font-medium">
                  Correo de destino
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.es"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  />
                </label>
                <div className="hidden" aria-hidden="true">
                  <label>
                    Web
                    <input
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  La dirección se utiliza para este envío y no se añade a ninguna lista de
                  distribución.
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Si no recibes el correo, revisa la carpeta de spam o correo no deseado.
                </p>
                <div
                  role="status"
                  aria-live="polite"
                  className={`text-sm ${error ? 'text-red-700' : 'text-[#1f4c57]'}`}
                >
                  {notice}
                </div>
                <button
                  disabled={sending}
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f4c57] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b6572] disabled:opacity-60"
                >
                  <Icon kind="mail" />
                  {sending ? 'Enviando…' : 'Enviar calendario'}
                </button>
              </form>
            </>
          )}
        </div>
      </dialog>
      <dialog
        ref={instructions}
        aria-labelledby="import-2027-title"
        onCancel={(event) => {
          event.preventDefault();
          closeInstructions();
        }}
        onClose={() => setInstructionsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeInstructions();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-[#dfe9eb] bg-[#f6f9fa] p-0 text-slate-700 shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h4 id="import-2027-title" className="text-xl font-semibold text-[#1f4c57]">
              Instrucciones para importar
            </h4>
            <button
              type="button"
              autoFocus
              onClick={closeInstructions}
              aria-label="Cerrar instrucciones"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200"
            >
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-600">
            Crea primero un calendario separado, por ejemplo «Urgencias 2027 · Grupo 1», y elígelo
            al importar. Importa cada archivo una sola vez para evitar duplicados. Estos archivos
            son una copia del turno rodado y no se actualizan automáticamente.
          </p>
          <div className="grid gap-3">
            <article className="space-y-2 rounded-xl bg-white p-4">
              <h5 className="font-semibold text-[#1f4c57]">Android</h5>
              <p className="text-sm leading-relaxed text-slate-700">
                Descarga el ICS y, desde un ordenador, abre Google Calendar → Configuración →
                Importar y exportar → Importar. Elige el archivo y el calendario de destino. Después
                aparecerá en tu móvil al sincronizar la misma cuenta de Google. La app de Google
                Calendar para Android no ofrece esta importación.
              </p>
              <a
                className="text-xs text-[#1f4c57] underline"
                href="https://support.google.com/calendar/answer/37118?hl=es"
                target="_blank"
                rel="noreferrer"
              >
                Ayuda de Google Calendar
              </a>
            </article>
            <article className="space-y-2 rounded-xl bg-white p-4">
              <h5 className="font-semibold text-[#1f4c57]">iPhone</h5>
              <p className="text-sm leading-relaxed text-slate-700">
                Antes de importar, crea un calendario nuevo para tus turnos:
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                <li>
                  Abre la app Calendario del iPhone y toca «Calendarios» en la parte inferior.
                </li>
                <li>Toca «Añadir calendario» y, de nuevo, «Añadir calendario».</li>
                <li>
                  Ponle un nombre, por ejemplo «Urgencias 2027 · Grupo 1». Selecciona la cuenta de
                  iCloud y un color, y toca «OK» o «Añadir» para guardarlo.
                </li>
                <li>
                  Vuelve a esta web, pulsa «Enviar por mail» en tu grupo y abre el mensaje recibido
                  en Mail de Apple.
                </li>
                <li>
                  Toca el adjunto ICS, pulsa «Añadir todos» si aparece y elige el calendario que
                  acabas de crear.
                </li>
              </ol>
              <p className="text-sm leading-relaxed text-slate-700">
                Si solo ves una previsualización, importa el archivo en un Mac usando ese calendario
                de iCloud para verlo también en el iPhone.
              </p>
              <a
                className="text-xs text-[#1f4c57] underline"
                href="https://support.apple.com/es-es/guide/iphone/ipha0d932e96/ios"
                target="_blank"
                rel="noreferrer"
              >
                Ayuda de Calendario en iPhone
              </a>
            </article>
            <article className="space-y-2 rounded-xl bg-white p-4">
              <h5 className="font-semibold text-[#1f4c57]">macOS</h5>
              <p className="text-sm leading-relaxed text-slate-700">
                Descarga el ICS. Abre Calendario → Archivo → Importar, selecciona el archivo y elige
                el calendario de destino. Si eliges un calendario de iCloud, los turnos se
                sincronizarán con tus dispositivos Apple.
              </p>
              <a
                className="text-xs text-[#1f4c57] underline"
                href="https://support.apple.com/es-es/guide/calendar/icl1023/mac"
                target="_blank"
                rel="noreferrer"
              >
                Ayuda de Calendario en Mac
              </a>
            </article>
          </div>
        </div>
      </dialog>
      <dialog
        ref={holidays}
        aria-labelledby="holidays-2027-title"
        onCancel={(event) => {
          event.preventDefault();
          closeHolidays();
        }}
        onClose={() => setHolidaysOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeHolidays();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[#dfe9eb] bg-white p-0 text-slate-700 shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="space-y-4 p-5 text-sm leading-relaxed text-slate-700 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h4 id="holidays-2027-title" className="text-xl font-semibold text-[#1f4c57]">
              Distribución de los festivos
            </h4>
            <button
              type="button"
              autoFocus
              onClick={closeHolidays}
              aria-label="Cerrar explicación de festivos"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200"
            >
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p>
            En los festivos trabaja un grupo de día (D) y otro de noche (N); los otros cuatro
            libran. Las asignaciones se calculan a partir del turno rodado habitual:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Lunes:</strong> se mantienen los grupos que tenían D y N previstos para ese
              día.
            </li>
            <li>
              <strong>De martes a jueves:</strong> el grupo que tenía T pasa a D y el que tenía TN
              pasa a N.
            </li>
            <li>
              <strong>Festivos consecutivos adyacentes a fines de semana:</strong> el grupo que
              tenía TN hace N; la D corresponde al grupo que tiene N el sábado.
            </li>

            <li>
              <strong>Sábados y domingos:</strong> se conserva la distribución habitual, sin
              cambios.
            </li>
          </ul>
        </div>
      </dialog>
    </section>
  );
}
