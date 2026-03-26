"use client"; // 客户端组件：侧边栏导航，支持本地化链接与文案

import { useState } from 'react';
import Link from '@/i18n/Link';
import DynamicLogo from "@/components/DynamicLogo";
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { TOOL_CATEGORIES } from '@/data/toolCategories';
import { getCategoryIcon } from '@/utils/categories';
import {useTranslations} from 'next-intl';
import useSidebarState from '@/hooks/useSidebarState';

// 侧边栏菜单项类型定义
type SubMenuItem = {
  name: string;
  href: string;
};

type MenuItem = {
  name: string;
  icon: string;
  href?: string;
  categoryId?: string;
  subMenuItems?: SubMenuItem[];
};

// 生成菜单数据（包含固定入口与按分类映射的入口）
function buildMenuItems(
  tCommon: ReturnType<typeof useTranslations>,
  tCategories: ReturnType<typeof useTranslations>
): MenuItem[] {
  return [
    {
      name: tCommon('menuTutorials'),
      icon: '/icons/nav/tutorials.svg',
      href: '/tutorials'
    },
    {
      name: tCommon('menuPodcast'),
      icon: '/icons/nav/podcast.svg',
      href: '/podcast'
    },
    {
      name: tCommon('menuEvents'),
      icon: '/icons/nav/events.svg',
      href: '/events'
    },
    {
      name: tCommon('menuDeals'),
      icon: '/icons/nav/deals.svg',
      href: '/deals'
    },
    // 添加分类菜单项
    ...TOOL_CATEGORIES.map(category => ({
      name: tCategories(String(category.id)) || category.name,
      icon: getCategoryIcon(category.id),
      categoryId: category.id,
      href: `/search?category=${category.id}`
    })),
    {
      name: tCommon('menuDevLog'),
      icon: '/icons/nav/devlog.svg',
      href: '/devlog'
    },
    {
      name: tCommon('menuAiLibrary'),
      icon: '/icons/nav/ai-library.svg',
      href: 'https://wcnsh3l3tys6.feishu.cn/wiki/Iui9wlWCtiI3gDkhz2wcL6YCnuh?table=tbljal7aWPWXgJUE&view=vew3Xh17va'
    },
    {
      name: tCommon('menuAbout'),
      icon: '/icons/nav/about.svg',
      href: '/about'
    }
  ];
}

export default function Sidebar({ siteTitle, collapsed: controlledCollapsed, onToggle }: { siteTitle?: string; collapsed?: boolean; onToggle?: () => void }) {
  // 翻译：通用命名空间（菜单固定项）
  const tCommon = useTranslations('Common');
  const tCategories = useTranslations('Categories');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuItems = buildMenuItems(tCommon, tCategories);

  // 使用 next-intl 的路由器，直接传入不带前缀的 href 即可自动加上当前语言前缀
  
  // 获取当前选中的类别
  const currentCategory = searchParams.get('category');
  
  // 追踪展开的子菜单
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  // 侧边栏折叠状态（支持外部受控）
  const {collapsed: internalCollapsed, toggle: internalToggle} = useSidebarState('sidebarCollapsed');
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggleSidebar = onToggle ?? internalToggle;

  // 切换子菜单展开/收起状态
  const toggleSubMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };
  
  // 切换侧边栏折叠状态由 hook 提供

  // 处理类别选择
  const handleCategoryClick = (categoryId: string | undefined, href: string) => {
    // 调试: 记录点击事件和当前 URL
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Sidebar] handleCategoryClick', {
        categoryId,
        href,
        currentUrl: window.location.href,
      });
    }
    // 如果没有类别ID（或者是"全部工具"）导航到首页
    if (!categoryId || href === '/') {
      router.push(href);
      
      if (process.env.NODE_ENV !== 'production') {
        console.info('[Sidebar] push to', href);
      }
      
      // 在移动端自动关闭侧边栏 - 确保"全部工具"也会关闭侧边栏
      if (window.innerWidth < 1024) {
        window.__ka21_closeSidebar?.();
      }
      return;
    }
    
    // 导航到搜索页面，带上分类参数
    router.push(`/search?category=${categoryId}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Sidebar] push to', `/search?category=${categoryId}`);
    }
    
    // 在移动端自动关闭侧边栏
    if (window.innerWidth < 1024) {
      window.__ka21_closeSidebar?.();
    }
  };

  // 处理链接点击
  const handleLinkClick = (href: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Sidebar] handleLinkClick', { href, currentUrl: window.location.href });
    }
    // 如果是外部链接，在新标签页打开
    if (href.startsWith('http')) {
      window.open(href, '_blank');
    } else {
      // 内部链接使用本地化路由（自动保留语言前缀）
      router.push(href);
      
      if (process.env.NODE_ENV !== 'production') {
        console.info('[Sidebar] push to', href);
      }
    }
    
    // 在移动端自动关闭侧边栏，确保"萌新教程"点击时也会关闭
    if (window.innerWidth < 1024) {
      window.__ka21_closeSidebar?.();
    }
  };

  return (
    <div className="site-glass-sidebar flex h-full flex-col">
      {/* 侧边栏头部 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className={`flex items-center transition-all duration-300 overflow-hidden w-full`}>
          <Link href="/" className={`flex items-center`}>
            <DynamicLogo
              size={collapsed ? "small" : "medium"}
              variant="black"
              className="text-primary-600 flex-shrink-0 dark:hidden"
              style={{
                width: collapsed ? '24px' : '40px',
                height: collapsed ? '24px' : '40px'
              }}
            />
            <DynamicLogo
              size={collapsed ? "small" : "medium"}
              variant="white"
              className="text-primary-600 hidden flex-shrink-0 dark:block"
              style={{
                width: collapsed ? '24px' : '40px',
                height: collapsed ? '24px' : '40px'
              }}
            />
            
            <span 
              className={`ml-2 text-lg font-serif font-semibold text-black dark:text-white whitespace-nowrap transition-all duration-300 tracking-wide ${collapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100'}`}
              style={{
                maxWidth: collapsed ? '0' : '200px',
                letterSpacing: '0.02em'
              }}
            >
              {siteTitle || tCommon('siteTitle')}
            </span>
          </Link>
        </div>
        
        {/* 折叠按钮 */}
        <button 
          onClick={toggleSidebar}
          className={`${collapsed ? 'absolute right-1 top-4' : ''} hidden h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/65 dark:hover:bg-gray-800/65 lg:flex`}
          aria-label={collapsed ? tCommon('sidebarExpand') : tCommon('sidebarCollapse')}
        >
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}></i>
        </button>
      </div>
      
      {/* 导航内容 */}
      <nav className="flex flex-grow flex-col items-start overflow-y-auto bg-transparent px-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className={`p-2 ${collapsed ? 'space-y-3' : 'space-y-1'}`}>
          {menuItems.map((item, index) => (
            <div key={index} className="mb-1">
              {item.subMenuItems && !collapsed ? (
                // 带子菜单的项目 - 展开状态
                <>
                  <button 
                    onClick={() => toggleSubMenu(item.name)}
                    className="flex items-center justify-start w-full pl-2 pr-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50/70 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/10 transition-colors duration-200 group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 min-w-8 rounded-lg bg-gray-50 dark:bg-gray-800 mr-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20">
                      <img src={item.icon} alt="" className="w-4 h-4" />
                    </span>
                    <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                    <i className={`fas fa-chevron-down ml-auto text-xs transform transition-transform text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 ${expandedMenus[item.name] ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {/* 子菜单 */}
                  <div className={`pl-12 mt-1 space-y-1 ${expandedMenus[item.name] ? 'block' : 'hidden'}`}>
                    {item.subMenuItems.map((subItem, subIndex) => (
                      <Link 
                        key={subIndex} 
                        href={subItem.href} 
                        className="block py-2 px-3 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors whitespace-nowrap rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                // 无子菜单的项目或折叠状态
                item.href && (item.href.startsWith('http') || (!item.categoryId && item.href !== '/')) ? (
                  // 直达页与外部链接使用handleLinkClick
                  <button
                    onClick={() => handleLinkClick(item.href || '/')}
                    className={`flex items-center justify-start w-full pl-2 pr-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50/70 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/10 transition-colors duration-200 group overflow-hidden ${
                      (item.href === pathname && item.href !== '/' && !currentCategory)
                      ? 'bg-primary-50/70 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400' : ''
                    }`}
                    title={item.name}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 min-w-8 rounded-lg bg-gray-50 dark:bg-gray-800 ${!collapsed && 'mr-3'} group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 ${
                      (item.href === pathname && item.href !== '/')
                      ? 'bg-primary-100 dark:bg-primary-900/20' : ''
                    }`}>
                      <img src={item.icon} alt="" className="w-4 h-4" />
                    </div>
                    <span className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
                         style={{
                           maxWidth: collapsed ? '0' : '160px',
                           marginLeft: collapsed ? '0' : undefined
                         }}>
                      {item.name}
                    </span>
                  </button>
                ) : (
                  // 其他菜单项使用handleCategoryClick
                  <button
                    onClick={() => handleCategoryClick(item.categoryId, item.href || '/')}
                    className={`flex items-center justify-start w-full pl-2 pr-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50/70 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/10 transition-colors duration-200 group overflow-hidden ${
                      (item.categoryId && item.categoryId === currentCategory) || 
                      (!item.categoryId && item.href === '/' && !currentCategory && pathname === '/') ||
                      (pathname === '/search' && !currentCategory && item.href === '/')
                      ? 'bg-primary-50/70 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400' : ''
                    }`}
                    title={item.name}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 min-w-8 rounded-lg bg-gray-50 dark:bg-gray-800 ${!collapsed && 'mr-3'} group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 ${
                      (item.categoryId && item.categoryId === currentCategory) ||
                      (!item.categoryId && item.href === '/' && !currentCategory)
                      ? 'bg-primary-100 dark:bg-primary-900/20' : ''
                    }`}>
                      <img src={item.icon} alt="" className="w-4 h-4" />
                    </div>
                    <span className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
                         style={{
                           maxWidth: collapsed ? '0' : '160px',
                           marginLeft: collapsed ? '0' : undefined
                         }}>
                      {item.name}
                    </span>
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
} 
