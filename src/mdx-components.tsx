import type { MDXComponents } from 'mdx/types';
import { Alert } from '@/components/mdx/Alert';
import { Pearl } from '@/components/mdx/Pearl';
import { Note } from '@/components/mdx/Note';
import { Tip } from '@/components/mdx/Tip';
import { Checklist } from '@/components/mdx/Checklist';
import WorldMapPopup from '@/components/mdx/WorldMapPopup';
import { Warning } from '@/components/mdx/Warning';
import { Box } from '@/components/mdx/Box';
import { BoxGrid } from '@/components/mdx/BoxGrid';
import { Formula } from '@/components/mdx/Formula';
import { DataTable } from '@/components/mdx/DataTable';
import { Callout } from '@/components/mdx/Callout';
import { MdxImage } from '@/components/mdx/MdxImage';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Alert,
    Pearl,
    Note,
    Tip,
    Checklist,
    WorldMapPopup,
    Warning,
    Box,
    BoxGrid,
    Formula,
    DataTable,
    Callout,
    Image: MdxImage,
    ...components,
  };
}
