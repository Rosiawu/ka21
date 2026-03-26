import React from 'react';

export default function SidebarSkeleton() {
  return (
    <div className="site-glass-sidebar flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
      </div>
      <div className="p-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-4"></div>
      </div>
    </div>
  );
}
