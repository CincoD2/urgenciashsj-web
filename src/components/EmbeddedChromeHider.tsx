'use client';

import { useSearchParams } from 'next/navigation';

export default function EmbeddedChromeHider() {
  const searchParams = useSearchParams();

  if (searchParams.get('embed') !== '1') {
    return null;
  }

  return (
    <style>{`
      header,
      footer {
        display: none !important;
      }

      body {
        min-height: auto !important;
      }

      body > main {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `}</style>
  );
}
