import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'custom';
  className?: string;
  alt?: string;
  variant?: 'black' | 'white';
}

export default function Logo({ 
  size = 'medium', 
  className = '', 
  alt = 'KA21',
  variant = 'black'
}: LogoProps) {
  // 尺寸映射
  const sizeClasses = {
    small: 'h-6 w-auto',      // 24px
    medium: 'h-8 w-auto',     // 32px  
    large: 'h-24 w-auto',     // 96px
    custom: ''
  };

  // 容器尺寸映射（用于响应式）
  const containerClasses = {
    small: 'w-24',           // 96px
    medium: 'w-28',          // 112px
    large: 'w-32',           // 128px
    custom: ''
  };

  const baseClasses = 'flex items-center justify-center';
  const sizeClass = sizeClasses[size];
  const containerClass = containerClasses[size];
  const logoSrc = variant === 'white' ? '/KA21-white.svg' : '/KA21.svg';

  return (
    <div className={`${baseClasses} ${containerClass} ${className}`}>
      <Image 
        src={logoSrc}
        alt={alt}
        width={40}
        height={40}
        className={`${sizeClass} transition-transform duration-200 hover:scale-105`}
        role="img"
        aria-label={alt}
        priority
      />
    </div>
  );
}
