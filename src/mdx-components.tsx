import type { MDXComponents } from 'mdx/types';
import { Alert } from '@/components/mdx/Alert';
import { Pearl } from '@/components/mdx/Pearl';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Alert,
    Pearl,
    ...components,
  };
}
