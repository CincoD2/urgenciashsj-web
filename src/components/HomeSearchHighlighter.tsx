'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const MARK_ATTR = 'data-home-search-mark';
const TARGET_ATTR = 'data-home-search-target';

function unwrapMarks(root: HTMLElement) {
  const marks = Array.from(root.querySelectorAll<HTMLElement>(`mark[${MARK_ATTR}]`));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      if (node.parentElement.closest(`mark[${MARK_ATTR}]`)) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  return nodes;
}

function highlightText(root: HTMLElement, query: string) {
  const matcher = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  let highlighted = false;

  for (const textNode of collectTextNodes(root)) {
    const text = textNode.textContent ?? '';
    if (!matcher.test(text)) continue;
    matcher.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    text.replace(matcher, (match, _group, offset) => {
      if (offset > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
      }
      const mark = document.createElement('mark');
      mark.setAttribute(MARK_ATTR, '1');
      mark.className = 'rounded bg-amber-200 px-0.5 text-inherit shadow-[0_0_0_1px_rgba(217,119,6,0.12)]';
      mark.textContent = match;
      fragment.appendChild(mark);
      lastIndex = offset + match.length;
      highlighted = true;
      return match;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return highlighted;
}

export default function HomeSearchHighlighter() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('homeSearch') ?? '').trim();
  const focusId = (searchParams.get('homeFocus') ?? '').trim();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-home-search-root]');
    if (!root) return;

    unwrapMarks(root);
    root.querySelectorAll<HTMLElement>(`[${TARGET_ATTR}]`).forEach((element) => {
      element.classList.remove('ring-2', 'ring-amber-300', 'ring-offset-2', 'ring-offset-white');
      element.removeAttribute('tabindex');
    });

    if (!query) return;

    const normalizedQuery = query.normalize('NFC');
    highlightText(root, normalizedQuery);

    const explicitTarget = focusId
      ? root.querySelector<HTMLElement>(`[${TARGET_ATTR}="${CSS.escape(focusId)}"]`)
      : null;
    const firstMarked = root.querySelector<HTMLElement>(`mark[${MARK_ATTR}]`);
    const focusTarget =
      explicitTarget ??
      firstMarked?.closest<HTMLElement>(`[${TARGET_ATTR}]`) ??
      firstMarked?.parentElement ??
      null;

    if (!focusTarget) return;

    focusTarget.classList.add('ring-2', 'ring-amber-300', 'ring-offset-2', 'ring-offset-white');
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const focusTimer = window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });
    }, 250);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [focusId, query]);

  return null;
}
