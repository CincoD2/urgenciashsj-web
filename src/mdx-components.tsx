import type { MDXComponents } from 'mdx/types';
import { Alert } from '@/components/mdx/Alert';
import { Pearl } from '@/components/mdx/Pearl';
import { Note } from '@/components/mdx/Note';
import { Tip } from '@/components/mdx/Tip';
import { Checklist } from '@/components/mdx/Checklist';
import { Warning } from '@/components/mdx/Warning';
import { Box } from '@/components/mdx/Box';
import { Formula } from '@/components/mdx/Formula';
import { DataTable } from '@/components/mdx/DataTable';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Alert,
    Pearl,
    Note,
    Tip,
    Checklist,
    Warning,
    Box,
    Formula,
    DataTable,
    ...components,
  };
}
