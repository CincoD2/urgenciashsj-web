'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const storageKey = 'urgenciashsj-cookie-consent';

type ConsentState = 'accepted' | 'rejected' | 'dismissed' | null;

type Props = {
  gaId?: string;
};

function AnalyticsScripts({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-setup" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}

export default function CookieNotice({ gaId }: Props) {
  const [consent, setConsent] = useState<ConsentState>(null);
  const hasAnalytics = Boolean(gaId);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as ConsentState;
    setConsent(stored ?? null);
  }, []);

  const accept = () => {
    window.localStorage.setItem(storageKey, 'accepted');
    setConsent('accepted');
  };

  const reject = () => {
    window.localStorage.setItem(storageKey, 'rejected');
    setConsent('rejected');
  };

  const dismiss = () => {
    window.localStorage.setItem(storageKey, 'dismissed');
    setConsent('dismissed');
  };

  const showNotice = consent === null;
  const shouldLoadAnalytics = hasAnalytics && consent === 'accepted';

  return (
    <>
      {shouldLoadAnalytics ? <AnalyticsScripts gaId={gaId!} /> : null}
      {showNotice ? (
        <div className="fixed inset-x-4 bottom-4 z-50 md:left-auto md:right-6 md:max-w-sm">
          <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <p className="text-sm text-slate-700">
              <b>Aviso legal</b>: Contenido dirigido exclusivamente a profesionales sanitarios con
              fines informativos y educativos. No sustituye el juicio clínico ni la valoración
              individual del paciente. El uso de la información es responsabilidad exclusiva del
              usuario.{' '}
              <a
                href="/disclaimer"
                className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
              >
                Leer más
              </a>
              .
            </p>
            <div className="my-3 h-px w-full bg-slate-200/70" />
            <p className="text-sm text-slate-700">
              <b>Esta web usa cookies</b> técnicas imprescindibles y, solo con tu consentimiento,
              cookies analíticas para mejorar el sitio.{' '}
              <a
                href="/cookies"
                className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
              >
                Política de cookies
              </a>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hasAnalytics ? (
                <>
                  <button
                    type="button"
                    onClick={accept}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Aceptar analíticas
                  </button>
                  <button
                    type="button"
                    onClick={reject}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Rechazar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
