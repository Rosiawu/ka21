import {useTranslations} from 'next-intl';
import {TOOL_CATEGORIES} from '@/data/toolCategories';
import {getCategoryIcon} from '@/utils/categories';
import {ToolCategoryId} from '@/lib/types';

export default function useCategoryMeta(categoryId: ToolCategoryId) {
  const tCategories = useTranslations('Categories');
  const tCategoryDesc = useTranslations('CategoryDesc');

  const cat = TOOL_CATEGORIES.find(c => c.id === categoryId);
  const name = (tCategories(String(categoryId)) || cat?.name || String(categoryId)) as string;
  const descCandidate = tCategoryDesc(String(categoryId)) as string | undefined;
  const isMissing = !descCandidate || descCandidate === categoryId || /^CategoryDesc\./.test(String(descCandidate));
  const description = isMissing ? undefined : descCandidate;
  const icon = getCategoryIcon(categoryId);

  return {name, description, icon};
}

