'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NotFoundTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const payload = {
      path: pathname || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    };

    fetch('/api/track-404', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silent on purpose: tracking should never break the 404 page.
    });
  }, [pathname]);

  return null;
}
