"use client"; // 客户端组件：通用搜索栏，支持本地化占位与 aria 文案

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useRef, useEffect } from 'react';
import {useTranslations} from 'next-intl';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tSearch = useTranslations('Search');
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    // 清除后自动聚焦搜索框
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // 处理键盘事件
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // Escape键清除输入
    if (e.key === 'Escape') {
      handleClear();
    }
  };
  
  // 添加全局键盘快捷键
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 按下Ctrl+K或Command+K时聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  return (
    <div className="flex items-stretch rounded-lg bg-white dark:bg-gray-800 shadow-input dark:shadow-gray-900/20 focus-within:shadow-lg dark:focus-within:shadow-gray-900/30 transition-shadow duration-200 sm:max-w-none max-w-full">
      {/* 输入框容器 */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={tSearch('searchPlaceholder')}
          className="w-full h-11 px-3 sm:px-5 pl-8 sm:pl-10 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none border-none focus:outline-none rounded-l-lg"
          aria-label={tSearch('inputAriaLabel')}
          autoComplete="off"
        />
        <svg
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      
      {/* 搜索按钮容器 */}
      <div className="flex-shrink-0 h-11 px-3 sm:px-6 flex items-center bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 active:scale-95 rounded-lg cursor-pointer transition-all duration-150">
        {value && (
          <button
            onClick={handleClear}
            className="mr-1 sm:mr-2 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-white hover:text-purple-100 dark:hover:text-purple-200 focus:outline-none rounded-full hover:bg-purple-800 dark:hover:bg-purple-500 transition-all duration-150"
            type="button"
            aria-label={tSearch('clearAction')}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        
        <button
          className="flex items-center justify-center text-white"
          type="button"
          aria-label={tSearch('searchAction')}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
} 
