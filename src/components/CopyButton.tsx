"use client";

import React from 'react';
import useClipboard from '@/hooks/useClipboard';

interface CopyButtonProps {
  text: string;
  label: string;
  copiedLabel?: string;
  className?: string;
}

export default function CopyButton({ text, label, copiedLabel, className }: CopyButtonProps) {
  const {copy, copied} = useClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className={className || 'inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'}
      aria-live="polite"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
      </svg>
      {copied ? (copiedLabel || label) : label}
    </button>
  );
}

