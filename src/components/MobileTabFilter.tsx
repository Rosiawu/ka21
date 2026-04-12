'use client';

import { useEffect, useRef } from 'react';
import { TOOL_CATEGORIES } from '@/data/toolCategories';

interface MobileTabFilterProps {
  onToolCategorySelect: (categoryId: string | null) => void;
  selectedToolCategory: string | null;
}

export default function MobileTabFilter({
  onToolCategorySelect,
  selectedToolCategory
}: MobileTabFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 滚动到选中项的函数
  const scrollToCategory = (categoryId: string) => {
    if (scrollRef.current) {
      const element = document.getElementById(`tab-${categoryId}`);
      if (element) {
        const container = scrollRef.current;
        const scrollLeft = element.offsetLeft - container.offsetLeft - 
          (container.offsetWidth / 2) + (element.offsetWidth / 2);
        
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };
  
  // 滚动到"全部"按钮
  const scrollToAllButton = () => {
    if (scrollRef.current) {
      const allButton = document.getElementById('tab-all');
      if (allButton) {
        const container = scrollRef.current;
        const scrollLeft = allButton.offsetLeft - container.offsetLeft - 
          (container.offsetWidth / 2) + (allButton.offsetWidth / 2);
        
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };
  
  // 在选择变化时滚动到对应位置
  useEffect(() => {
    if (selectedToolCategory) {
      scrollToCategory(selectedToolCategory);
    } else {
      scrollToAllButton();
    }
  }, [selectedToolCategory]);
  
  // 选择分类函数
  const selectCategory = (id: string) => {
    const finalId = id === 'all' ? null : id;
    
    // 避免重复选择同一项
    if (finalId === selectedToolCategory) {
      return;
    }
    
    // 更新工具类型选择
    onToolCategorySelect(finalId);
  };
  
  return (
    <div className="mb-4 lg:hidden">
      {/* 水平滚动分类标签 */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto pb-1 hide-scrollbar" 
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          id="tab-all"
          onClick={() => selectCategory('all')}
          className={`flex-shrink-0 px-4 py-2 mr-2 rounded-full text-sm whitespace-nowrap transition-colors ${
            !selectedToolCategory 
              ? 'bg-[#e06b6b] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部
        </button>

        {TOOL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`tab-${cat.id}`}
            onClick={() => selectCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 mr-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedToolCategory === cat.id
                ? 'bg-[#e06b6b] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      {/* 隐藏滚动条但保留功能的CSS */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 