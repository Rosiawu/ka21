"use client";

import Sidebar from './Sidebar';
import {useTranslations} from 'next-intl';

export default function SidebarWrapper({
  collapsed,
  onToggle
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const tCommon = useTranslations('Common');
  return <Sidebar siteTitle={tCommon('sidebarTitle')} collapsed={collapsed} onToggle={onToggle} />;
}
