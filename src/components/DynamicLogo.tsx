'use client';

import Image from 'next/image';

interface DynamicLogoProps {
  size?: 'small' | 'medium' | 'footer' | 'large';
  className?: string;
  style?: React.CSSProperties;
  variant?: 'black' | 'white';
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({
  size = 'medium',
  className = '',
  style = {},
  variant = 'black'
}) => {
  const dimensions = {
    small: { width: 24, height: 24 },
    medium: { width: 40, height: 40 },
    footer: { width: 56, height: 56 },
    large: { width: 180, height: 180 },
  }[size];
  
  const logoSrc = variant === 'white' ? '/KA21-white.svg' : '/KA21.svg';
  
  return (
    <Image
      src={logoSrc}
      alt="数字生命卡兹克-KA21 Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      style={style}
      unoptimized
      priority
    />
  );
};

export default DynamicLogo; 
