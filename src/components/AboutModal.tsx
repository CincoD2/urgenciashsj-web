'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function AboutModal({ open, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!open) {
      setMessage('');
      setWebsite('');
      setStatus('idle');
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setStatus('sending');
    try {
      let token = '';
      if (siteKey && typeof window !== 'undefined' && window.grecaptcha?.execute) {
        token = await window.grecaptcha.execute(siteKey, { action: 'contact' });
      }
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, website, recaptchaToken: token }),
      });
      if (!res.ok) throw new Error('Error');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {siteKey ? (
        <Script src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`} strategy="afterInteractive" />
      ) : null}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
        <div className="space-y-4 text-sm text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">Acerca de UrgenciasHSJ.es</h2>
          <p>
            Esta web nace de la práctica diaria en un Servicio de Urgencias. No recoge ninguna información personal
            del usuario, por lo que tu privacidad está garantizada. No obstante, te pido que leas el{' '}
            <a
              href="/disclaimer"
              className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
            >
              disclaimer
            </a>
            .
          </p>
          <p>
            Los médicos de urgencias atendemos pacientes con patologías de muy diversa índole, en contextos de alta
            presión asistencial y con necesidad de toma de decisiones rápidas y fundamentadas. La información clínica
            de referencia —protocolos, escalas, algoritmos y recomendaciones— se encuentra a menudo dispersa en
            múltiples fuentes, documentos y plataformas incluso dentro del mismo Departamento donde trabajamos.
          </p>
          <p>
            UrgenciasHSJ.es surge con el objetivo de concentrar en un único espacio las herramientas y contenidos
            necesarios para el trabajo diario en un turno de urgencias, facilitando el acceso rápido a información
            protocolizada y contribuyendo a mejorar el flujo de trabajo asistencial.
          </p>
          <p>
            Si detectas un error o tienes alguna sugerencia, puedes transmitirla de forma anónima a través de este
            formulario:
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="sr-only" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escribe tu mensaje..."
            className="min-h-[120px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-400"
          />
          {status === 'sent' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Gracias, hemos recibido tu mensaje.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={status === 'sending' || status === 'sent' || message.trim().length === 0}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'sending' ? 'Enviando...' : status === 'sent' ? 'Enviado' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cerrar
            </button>
            {status === 'error' && (
              <span className="text-xs text-red-600">No se pudo enviar. Inténtalo más tarde.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
