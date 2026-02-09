import {ToolCategoryId} from '@/lib/types';

interface BuildSearchUrlOptions {
  q?: string;
  category?: ToolCategoryId | null;
  basePath?: string; // default '/search'
}

export function buildSearchUrl({ q, category, basePath = '/search' }: BuildSearchUrlOptions): string {
  const params = new URLSearchParams();
  if (q && q.trim()) params.set('q', q.trim());
  if (category) params.set('category', category);
  const query = params.toString();
  if (!query) return '/';
  return `${basePath}?${query}`;
}

