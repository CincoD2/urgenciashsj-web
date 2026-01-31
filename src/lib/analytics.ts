export const cookieConsentStorageKey = 'urgenciashsj-cookie-consent';

export type ConsentState = 'accepted' | 'rejected' | 'dismissed' | null;

export function getAnalyticsConsent(): ConsentState {
  if (typeof window === 'undefined') return null;
  return (window.localStorage.getItem(cookieConsentStorageKey) as ConsentState) ?? null;
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === 'accepted';
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', event, params ?? {});
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
