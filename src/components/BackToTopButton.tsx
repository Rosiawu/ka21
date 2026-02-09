"use client"; // 客户端组件：返回顶部按钮，支持本地化 aria 文案

import { useEffect, useState } from 'react';
import {useTranslations} from 'next-intl';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const tCommon = useTranslations('Common');
  
  useEffect(() => {
    const toggleVisibility = () => {
      // 当页面滚动超过300px时显示返回顶部按钮
      const scrolled = window.pageYOffset > 300;
      setIsVisible(scrolled);
    };
    
    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility(); // 初始化时调用一次
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  if (!isVisible) return null;
  
  return (
    <button
      onClick={scrollToTop}
      className="fixed right-4 bottom-4 p-2.5 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all duration-300 hover:scale-110 z-[9999]"
      aria-label={tCommon('backToTop')}
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M5 10l7-7m0 0l7 7m-7-7v18" 
        />
      </svg>
    </button>
  );
} 
