'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SITE_TITLE = 'urgenciashsj.es';

function resolvePageTitle() {
  const heading = document.querySelector('main h1, h1');
  const headingText = heading?.textContent?.trim();

  if (!headingText) {
    return SITE_TITLE;
  }

  return `${SITE_TITLE} · ${headingText}`;
}

export default function PageTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    const updateTitle = () => {
      document.title = resolvePageTitle();
    };

    updateTitle();

    const observer = new MutationObserver(() => {
      updateTitle();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
