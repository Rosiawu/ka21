"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import {Suspense} from 'react';
import {useTranslations} from 'next-intl';
import SidebarWrapper from '@/components/SidebarWrapper';
import SidebarSkeleton from '@/components/SidebarSkeleton';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleToggle from '@/components/LocaleToggle';
import DynamicLogo from '@/components/DynamicLogo';
import BackToTopButton from '@/components/BackToTopButton';
import BeianInfo from '@/components/BeianInfo';
import Image from 'next/image';
import useSidebarState from '@/hooks/useSidebarState';
import useMediaQuery from '@/hooks/useMediaQuery';

declare global {
  interface Window {
    __ka21_closeSidebar?: () => void;
  }
}

export default function LayoutContainers({
  children
}: {
  children: React.ReactNode;
}) {
  const tCommon = useTranslations('Common');

  // 折叠状态：桌面端使用；本地存储持久化
  const {collapsed, toggle: toggleCollapsed} = useSidebarState('sidebarCollapsed');

  // 断点：Tailwind lg 对应 1024px
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // 移动端抽屉开关
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const mobileBtnRef = useRef<HTMLButtonElement>(null);

  // 桌面与移动切换时校正移动抽屉状态
  useEffect(() => {
    if (isDesktop && mobileOpen) setMobileOpen(false);
  }, [isDesktop, mobileOpen]);

  // 提供全局关闭方法，供 Sidebar 在点击导航后关闭移动端抽屉
  useEffect(() => {
    window.__ka21_closeSidebar = () => setMobileOpen(false);
    return () => {
      delete window.__ka21_closeSidebar;
    };
  }, []);

  // 点击页面空白处关闭（仅移动端且抽屉开启时）
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!mobileOpen) return;
      if (isDesktop) return;
      const leftEl = leftRef.current;
      const btnEl = mobileBtnRef.current;
      const target = e.target as Node | null;
      if (!leftEl) return;
      const clickedInsideSidebar = !!(target && leftEl.contains(target));
      const clickedOnButton = !!(target && btnEl && btnEl.contains(target));
      if (!clickedInsideSidebar && !clickedOnButton) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [mobileOpen, isDesktop]);

  // 顶部导航随滚动隐藏/显示
  const [headerHidden, setHeaderHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > lastY && y > 50) {
          setHeaderHidden(true);
        } else {
          setHeaderHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  const leftContainerClass = useMemo(() => {
    return [
      'left-container',
      collapsed ? 'left-container-collapsed' : 'left-container-expanded',
      mobileOpen ? 'mobile-expanded' : ''
    ].join(' ').trim();
  }, [collapsed, mobileOpen]);

  const rightContainerClass = useMemo(() => {
    return [
      'right-container',
      collapsed ? 'right-container-collapsed' : 'right-container-expanded'
    ].join(' ').trim();
  }, [collapsed]);

  const backdropClass = useMemo(() => {
    return ['sidebar-backdrop', mobileOpen ? 'active' : ''].join(' ').trim();
  }, [mobileOpen]);

  return (
    <div className="dual-container">
      {/* 左侧容器 - 侧边栏 */}
      <div id="left-container" ref={leftRef} className={leftContainerClass}>
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarWrapper collapsed={collapsed} onToggle={toggleCollapsed} />
        </Suspense>
        {/* 折叠切换按钮保留在 Sidebar 内 */}
      </div>

      {/* 移动端侧边栏背景遮罩 */}
      <div id="sidebar-backdrop" className={backdropClass} onClick={() => setMobileOpen(false)} />

      {/* 右侧容器 - 主内容区 */}
      <div id="right-container" className={rightContainerClass}>
        {/* 顶部导航 */}
        <header
          ref={headerRef}
          className="relative top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-neutral-200/50 dark:border-slate-700/50"
          style={{
            willChange: 'transform',
            transform: headerHidden ? 'translateY(-100%)' : 'translateY(0)',
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            {/* 移动端菜单按钮 */}
            <button
              id="mobileMenuButton"
              ref={mobileBtnRef}
              className="lg:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors duration-200"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle sidebar"
              aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5 dark:text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>

            {/* 导航部分（主导航已移至侧边栏） */}
            <div className="flex-1 flex justify-center">
              <nav className="hidden md:flex items-center space-x-1"></nav>
            </div>

            {/* 工具按钮（主题切换、语言切换、提交工具） */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Suspense fallback={null}>
                <LocaleToggle />
              </Suspense>
              <a
                href="https://y9bogpjyql.feishu.cn/share/base/form/shrcnxbOdZQKp3Js9QTo1lvRMIe"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-4 py-2 rounded-md font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                {tCommon('submitTool')}
              </a>
            </div>
          </div>

          {/* 移动端菜单容器（预留） */}
          <div id="mobileMenu" className="hidden md:hidden bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-700">
            <div className="py-2 space-y-1 px-4"></div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-grow">
          {children}
          <BackToTopButton />
        </main>

        {/* 页脚 */}
        <footer id="main-footer" className="bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-700 py-10 mt-16">
          <div className="max-w-8xl mx-auto px-3 sm:px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 左侧：网站简介 */}
              <div>
                <div className="flex items-center gap-2 h-14 mb-4">
                  <DynamicLogo size="footer" className="w-14 h-14 shrink-0 object-contain" />
                  <span className="text-lg font-medium leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">{tCommon('siteTitle')}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {tCommon('footerIntro1')}
                  <br />
                  {tCommon('bookmarkNote')}
                </p>
              </div>
              {/* 中间：导航链接（预留） */}
              <div></div>
              {/* 右侧：联系方式二维码 */}
              <div className="flex flex-col items-center">
                <div className="flex flex-row gap-6 justify-center items-center">
                  <div className="flex flex-col items-center">
                    <Image src="/images/social/wechat-qr.png" alt={tCommon('wechatLabel')} className="w-20 h-20 rounded" width={80} height={80} />
                    <span className="mt-2 text-xs text-neutral-500">{tCommon('wechatLabel')}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image src="/images/social/wechat-official-qr.png" alt={tCommon('officialAccountLabel')} className="w-20 h-20" width={80} height={80} />
                    <span className="mt-2 text-xs text-neutral-500">{tCommon('officialAccountLabel')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-slate-700 mt-10 pt-8 flex flex-col items-center">
              <BeianInfo />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
