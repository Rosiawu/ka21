import React from 'react';

interface ToolGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function ToolGrid({ children, className }: ToolGridProps) {
  return (
    <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ${className || ''}`}>
      {children}
    </div>
  );
}

