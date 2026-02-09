import React from 'react';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  prefix?: string;
}

export default function FilterChip({ label, onRemove, prefix }: FilterChipProps) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
      {prefix ? `${prefix} ` : ''}{label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        aria-label="remove filter"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </span>
  );
}

