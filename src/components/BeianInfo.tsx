'use client';

export default function BeianInfo() {
  return (
    <div className="w-full text-left text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-start">
      <span>
        Copyright © 2025-2026 {' '}
        <a 
          href="https://ka21.org/zh" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-inherit dark:!text-gray-100 hover:text-primary-600 dark:hover:!text-white transition-colors"
        >
          KA21 AI牛马库
        </a>
      </span>
    </div>
  );
}
