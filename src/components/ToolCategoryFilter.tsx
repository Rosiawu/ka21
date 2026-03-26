'use client';

import { useState } from 'react';
import { ToolCategory } from '@/lib/types';
import { getCategoryIcon } from '@/utils/categories';

interface ToolCategoryFilterProps {
  categories: ToolCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export default function ToolCategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect
}: ToolCategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 分类图标统一映射
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      {/* 标题栏 */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-lg font-bold text-gray-800">工具类型分类</h2>
          <p className="text-sm text-gray-600">按功能类型筛选工具</p>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* 折叠内容 */}
      {isExpanded && (
        <div className="mt-4 space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(
                selectedCategory === category.id ? null : category.id
              )}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-primary-50 text-primary-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {/* 使用FontAwesome图标代替Image组件 */}
                <i className={`fas ${getCategoryIcon(category.id)} ${
                  selectedCategory === category.id
                    ? "text-primary-500"
                    : "text-gray-500"
                }`}></i>
              </div>
              <span className={`ml-2 font-medium text-sm ${
                selectedCategory === category.id
                  ? "text-primary-600"
                  : "text-gray-700"
              }`}>
                {category.name}
              </span>
              <span className="ml-auto text-sm text-gray-400">
                {selectedCategory === category.id && "✓"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
