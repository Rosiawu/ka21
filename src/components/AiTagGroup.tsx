'use client';

import React from 'react';
import { selectTopTags } from '@/lib/aiTags';
import AiTagBadge from './AiTagBadge';

interface AiTagGroupProps {
  tags: string[];
  maxTags?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function AiTagGroup({ 
  tags, 
  maxTags = 3,
  size = 'sm',
  className = ''
}: AiTagGroupProps) {
  // 最多选择指定数量的标签
  const displayTags = selectTopTags(tags).slice(0, maxTags);
  
  if (displayTags.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tagId) => (
        <AiTagBadge key={tagId} tagId={tagId} size={size} />
      ))}
    </div>
  );
}

export default React.memo(AiTagGroup); 