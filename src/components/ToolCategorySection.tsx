import { useState, useMemo } from 'react';
import { Tool, ToolCategory } from '@/lib/types';
import ToolCard from './ToolCard';
import { SortMethod } from './ToolSortControls';
import { applySorting } from '@/utils/sortTools';
import CategoryHeader from '@/components/CategoryHeader';
import ToolGrid from '@/components/ToolGrid';
import ToolSortControls from './ToolSortControls';

interface ToolCategorySectionProps {
  category: ToolCategory;
  tools: Tool[];
  showAll?: boolean; // 是否显示该分类下的所有工具，默认false只显示前6个
}

/**
 * 工具分类区块组件
 * 用于在首页的分类列表中展示某一类工具，并支持该分类内的排序功能
 */
export default function ToolCategorySection({ 
  category, 
  tools,
  showAll = false 
}: ToolCategorySectionProps) {
  // 排序方式状态，默认为默认排序
  const [sortMethod, setSortMethod] = useState<SortMethod>('default');
  
  // 分类图标统一映射
  
  // 根据排序方式对工具进行排序
  const sortedTools = useMemo(() => {
    // 使用applySorting函数简化排序逻辑
    return applySorting(tools, sortMethod);
  }, [tools, sortMethod]);
  
  // 最终显示的工具列表，如果不是显示全部，则仅显示前6个
  const displayTools = showAll ? sortedTools : sortedTools.slice(0, 6);
  
  return (
    <div className="space-y-6 mb-16" id={`category-${category.id}`}>
      <CategoryHeader 
        categoryId={category.id}
        count={tools.length}
        rightSlot={(
          <div className="hidden md:flex gap-1">
            <ToolSortControls currentSort={sortMethod} onSortChange={setSortMethod} />
          </div>
        )}
        viewAllHref={!showAll && tools.length > 6 ? `/search?category=${category.id}` : undefined}
      />
      
      <ToolGrid>
        {displayTools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </ToolGrid>
    </div>
  );
} 
