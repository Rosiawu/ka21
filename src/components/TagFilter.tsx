'use client';

import { Tag } from '@/lib/types';

interface TagFilterProps {
  tags: Tag[];
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
}

export default function TagFilter({ tags, selectedTags, onTagSelect }: TagFilterProps) {
  return (
    <div>
      <h3 className="text-md font-semibold text-gray-700 mb-3">标签筛选</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagSelect('全部' as Tag)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium
            transition-colors duration-200
            ${selectedTags.length === 0
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
          `}
        >
          全部
        </button>
        {tags.sort().map(tag => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              transition-colors duration-200
              ${selectedTags.includes(tag)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
} 