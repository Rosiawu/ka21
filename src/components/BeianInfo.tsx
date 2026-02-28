'use client';

export default function BeianInfo() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="w-full text-left text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-start">
      <span>
        Copyright © {currentYear} {' '}
        <a 
          href="https://ka21.org/zh" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary-600 transition-colors"
        >
          KA21 AI牛马库
        </a>
      </span>
    </div>
  );
}
