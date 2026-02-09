'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

interface DynamicLogoProps {
  size?: 'small' | 'medium' | 'footer' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({ size = 'medium', className = '', style = {} }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 等待客户端完成 Hydration 再读取主题，避免闪烁和服务端不一致。
  const isDark = useMemo(() => {
    if (!mounted) return false;
    return resolvedTheme === 'dark';
  }, [mounted, resolvedTheme]);

  const dimensions = {
    small: { width: 24, height: 24 },
    medium: { width: 40, height: 40 },
    footer: { width: 56, height: 56 },
    large: { width: 180, height: 180 },
  }[size];
  
  // 根据主题选择 logo 图像。
  const logoSrc = isDark ? '/KA21-white.png?v=1' : '/KA21.png?v=1';
  
  return (
    <Image
      src={logoSrc}
      alt="数字生命卡兹克-KA21 Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      style={style}
      priority
    />
  );
};

export default DynamicLogo; 
