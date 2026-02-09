import {Tool, ToolCategoryId} from '@/lib/types';
import {TOOL_CATEGORIES} from '@/data/toolCategories';

export interface FilterOptions {
  query?: string;
  categoryId?: ToolCategoryId;
}

export function filterTools(tools: Tool[], opts: FilterOptions = {}): Tool[] {
  const {query, categoryId} = opts;

  const validCategory = categoryId && TOOL_CATEGORIES.some(c => c.id === categoryId) ? categoryId : undefined;
  const normalizedQuery = (query || '').trim().toLowerCase();

  return tools.filter((tool) => {
    if (validCategory && tool.toolCategory !== validCategory) return false;

    if (normalizedQuery) {
      const inName = tool.name.toLowerCase().includes(normalizedQuery);
      const inDesc = tool.description.toLowerCase().includes(normalizedQuery);
      const inTags = Array.isArray(tool.tags) && tool.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
      if (!(inName || inDesc || inTags)) return false;
    }

    return true;
  });
}

