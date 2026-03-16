'use client';

import { usePathname } from 'next/navigation';
import LayoutContainers from '@/components/LayoutContainers';

function isImmersiveAboutPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return /^\/(zh|en)\/about\/?$/.test(pathname);
}

export default function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isImmersiveAboutPath(pathname)) {
    return <>{children}</>;
  }

  return <LayoutContainers>{children}</LayoutContainers>;
}
