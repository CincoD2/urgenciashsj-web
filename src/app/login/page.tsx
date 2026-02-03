'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { registerUser } from './actions';
import { LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/lib/sessionKeys';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              width?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              click_listener?: () => void;
            }
          ) => void;
        };
      };
    };
  }
}

function LoginContent() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const searchParams = useSearchParams();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const isLoading = status === 'loading';
  const isAuthed = status === 'authenticated';

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleReady || isLoading || isAuthed || !googleButtonRef.current) return;

    const renderButton = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: () => {
          // Usamos el flujo OAuth de NextAuth; el callback no se usa aquí.
        },
      });
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: '100%',
          click_listener: () => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
            signIn('google', { callbackUrl: '/' });
          },
        });
      }
    };

    if (window.google?.accounts?.id) {
      renderButton();
    }
  }, [googleReady, isAuthed, isLoading, mode]);

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === '1') {
      setError(null);
      setSuccess('Email confirmado. Ya puedes iniciar sesión.');
      setMode('login');
    } else if (verified === 'expired') {
      setSuccess(null);
      setError('El enlace de confirmación ha caducado. Regístrate de nuevo.');
    } else if (verified === 'error') {
      setSuccess(null);
      setError('No se pudo confirmar el email. Inténtalo de nuevo.');
    }
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGoogleReady(true)}
        />
      )}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#4d7a86]">Zona privada</p>
        <h1 className="text-3xl font-semibold text-slate-900">Iniciar sesión o registrarse</h1>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[#dfe9eb] bg-white/90 p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-600">Comprobando sesión…</p>
        ) : isAuthed ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Conectado como{' '}
              <span className="font-semibold">{session?.user?.email ?? 'usuario'}</span>.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
              >
                Cerrar sesión
              </button>
              <a
                href="/parte-jefatura"
                className="rounded-md border border-[#2b5d68]/30 px-4 py-2 text-sm font-semibold text-[#2b5d68]"
              >
                Ir al parte de jefatura
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="flex rounded-lg border border-[#dfe9eb] bg-white">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  mode === 'login' ? 'bg-[#2b5d68] text-white' : 'text-[#2b5d68]'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  mode === 'register' ? 'bg-[#2b5d68] text-white' : 'text-[#2b5d68]'
                }`}
              >
                Registrarse
              </button>
            </div>

            {mode === 'login' ? (
              <form
                key="login"
                className="space-y-3"
                autoComplete="on"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError(null);
                  setSuccess(null);
                  const form = event.currentTarget;
                  const formData = new FormData(form);
                  const email = String(formData.get('email') || '');
                  const password = String(formData.get('password') || '');
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                  }
                  const res = await signIn('credentials', {
                    redirect: false,
                    email,
                    password,
                  });
                  if (res?.error) {
                    setError('Credenciales incorrectas o email sin confirmar.');
                  } else {
                    setSuccess('Acceso correcto. Redirigiendo...');
                    window.location.href = '/';
                  }
                }}
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    placeholder="tu@correo.com"
                    autoComplete="section-login username"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contraseña
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
                >
                  Entrar
                </button>
              </form>
            ) : (
              <form
                key="register"
                className="space-y-3"
                autoComplete="off"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError(null);
                  setSuccess(null);
                  const formData = new FormData(event.currentTarget);
                  const result = await registerUser(formData);
                  if (!result.ok) {
                    setError(result.message);
                  } else {
                    setSuccess(
                      result.message ?? 'Registro recibido. Revisa tu email para confirmar.'
                    );
                    setMode('login');
                  }
                }}
              >
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-amber-700">
                  El Registro debe ser aprobado por el administrador
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nombre y apellidos
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    autoComplete="section-register name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hospital
                  </label>
                  <select
                    name="hospital"
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona una opción
                    </option>
                    <option value="Hospital de San Juan">Hospital de San Juan</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </label>
                  <select
                    name="position"
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona una opción
                    </option>
                    <option value="Adjunto">Adjunto</option>
                    <option value="Residente">Residente</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    placeholder="tu@correo.com"
                    autoComplete="section-register email"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contraseña
                  </label>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Repite la contraseña
                  </label>
                  <input
                    name="passwordConfirm"
                    type="password"
                    minLength={8}
                    required
                    className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
                >
                  Crear cuenta
                </button>
              </form>
            )}

            {(error || success) && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  error
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {error ?? success}
              </div>
            )}

            <div className="flex justify-center">
              <div ref={googleButtonRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[40vh] w-full max-w-3xl px-6 py-16" />}>
      <LoginContent />
    </Suspense>
  );
}
