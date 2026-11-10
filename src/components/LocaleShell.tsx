'use client';

import { usePathname } from 'next/navigation';
import LayoutContainers from '@/components/LayoutContainers';

function isImmersivePath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return /^\/(zh|en)\/(?:about|fde(?:\/.*)?)\/?$/.test(pathname);
}

export default function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isImmersivePath(pathname)) {
    return <>{children}</>;
  }

  return <LayoutContainers>{children}</LayoutContainers>;
}
