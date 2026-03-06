'use client';

import { useEffect } from 'react';

function isPrimaryClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
}

export default function OutboundLinkInterceptor() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.dataset.noOutboundTrack === 'true') return;
      if (!isPrimaryClick(event)) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      let destination: URL;
      try {
        destination = new URL(anchor.href);
      } catch {
        return;
      }

      if (!['http:', 'https:'].includes(destination.protocol)) return;
      if (destination.origin === window.location.origin) return;

      event.preventDefault();

      const redirectUrl = `/out?to=${encodeURIComponent(destination.toString())}&from=${encodeURIComponent(window.location.pathname)}`;
      if (anchor.target === '_blank') {
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      window.location.assign(redirectUrl);
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, []);

  return null;
}
