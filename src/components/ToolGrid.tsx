import React from 'react';

interface ToolGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function ToolGrid({ children, className }: ToolGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ${className || ''}`}>
      {children}
    </div>
  );
}
