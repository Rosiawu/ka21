'use client';

import Image from 'next/image';

export default function BeianInfo() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="w-full text-left text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-start">
      <span>
        Copyright © {currentYear} {' '}
        <a 
          href="http://www.ka21ai.cn/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary-600 transition-colors"
        >
          卡兹克AI工具导航
        </a>
      </span>
      <a 
        href="https://beian.miit.gov.cn/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="hover:text-primary-600 transition-colors"
      >
        豫ICP备2025120682号-1
      </a>
      <a 
        href="https://beian.mps.gov.cn/#/query/webSearch?code=41070202001644" 
        rel="noreferrer" 
        target="_blank" 
        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
      >
        <Image 
          src="/images/beian-police.png" 
          alt="公安备案" 
          width={20} 
          height={20} 
          style={{ display: 'inline' }} 
        />
        豫公网安备41070202001644号
      </a>
    </div>
  );
} 