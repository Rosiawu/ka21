"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import ToolList from '@/components/ToolList';
import toolsData from '@/data/tools.json';
import { Tool, ToolCategoryId } from '@/lib/types';
import { validateTools } from '@/lib/validate';
import { TOOL_CATEGORIES } from '@/data/toolCategories';
import ToolSortControls, { SortMethod } from './ToolSortControls';
import { applySorting, sortByDefaultOrder, getVisibleTools } from '@/utils/sortTools';
import { filterTools } from '@/utils/filterTools';
import useHotkey from '@/hooks/useHotkey';
import { useTranslations } from 'next-intl';
import Breadcrumb from '@/components/Breadcrumb';
import FilterChip from '@/components/FilterChip';
import CopyButton from '@/components/CopyButton';
import { buildSearchUrl } from '@/utils/buildSearchUrl';
import useWeChatShare from '@/hooks/useWeChatShare';

const allTools = toolsData.tools as Tool[];
if (!validateTools(allTools)) {
  throw new Error('工具数据验证失败');
}

const tools = getVisibleTools(allTools);

export default function SearchContent() {
  const tSearch = useTranslations('Search');
  const tCommon = useTranslations('Common');
  const tCategories = useTranslations('Categories');
  const tCategoryDesc = useTranslations('CategoryDesc');
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ locale?: string; category?: string }>();
  const locale = params?.locale || 'zh';
  const searchQuery = searchParams.get('q') || '';
  const categoryFromPath = params?.category || null;
  const categoryFromQuery = searchParams.get('category');
  const rawCategoryParam = categoryFromPath || categoryFromQuery;
  const categoryParam = (
    rawCategoryParam &&
    TOOL_CATEGORIES.some(cat => cat.id === rawCategoryParam)
  ) ? (rawCategoryParam as ToolCategoryId) : null;

  const [sortMethod, setSortMethod] = useState<SortMethod>('default');
  const [inputValue, setInputValue] = useState(searchQuery);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [sortedTools, setSortedTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const filtered = filterTools(tools, {
        query: searchQuery || undefined,
        categoryId: categoryParam && TOOL_CATEGORIES.some(cat => cat.id === categoryParam) ? (categoryParam as ToolCategoryId) : undefined
      });
      setFilteredTools(filtered);
      setSortedTools(sortByDefaultOrder(filtered));
      setIsLoading(false);
    } catch (e) {
      setError(e as Error);
      setIsLoading(false);
    }
  }, [searchQuery, categoryParam]);

  useEffect(() => {
    if (!filteredTools.length) return;
    setSortedTools(applySorting(filteredTools, sortMethod));
  }, [filteredTools, sortMethod]);

  const handleSortChange = (method: SortMethod) => setSortMethod(method);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const qs = buildSearchUrl({
      q: inputValue.trim(),
      category: categoryParam,
      basePath: `/${locale}/search`
    });
    router.push(qs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setInputValue('');
  };

  useHotkey([{ combo: 'ctrl+k', handler: () => searchInputRef.current?.focus() }]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const categoryName = categoryParam
    ? (tCategories(categoryParam as string) || TOOL_CATEGORIES.find(c => c.id === categoryParam)?.name || tSearch('unknownCategory'))
    : null;
  const categoryDesc = categoryParam ? (() => {
    const val = tCategoryDesc(categoryParam as string);
    const isMissing = !val || val === categoryParam || /^CategoryDesc\./.test(String(val));
    if (!isMissing) return val;
    return undefined;
  })() : null;

  const shareData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = categoryParam && !searchQuery
      ? `${origin}/${locale}/search/${categoryParam}`
      : (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '');
    const title = searchQuery
      ? `KA21 搜索结果：${searchQuery}`
      : categoryName
        ? `KA21 工具分类：${categoryName}`
        : 'KA21 AI牛马库';

    return {
      title,
      desc: 'KA21 工具导航只收录亲测好用的 AI 工具，帮你快速找到靠谱工具。',
      link,
      imgUrl: `${origin}/KA21.png`
    };
  }, [categoryName, categoryParam, locale, searchQuery]);

  const { isWeChat, ready: wechatShareReady } = useWeChatShare(shareData);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"
      ></div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"
      ></div>

      <div className="page-shell relative z-10 py-6">
        <div className="max-w-8xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl mb-2">
              {searchQuery && (
                <>
                  {tSearch('results')}
                  <span className="text-primary-600 dark:text-primary-400">: &quot;{searchQuery}&quot;</span>
                </>
              )}
              {categoryName && !searchQuery && (
                <>
                  {tSearch('categoryPrefix')} <span className="text-primary-600 dark:text-primary-400">{categoryName}</span>
                </>
              )}
              {!searchQuery && !categoryName && <>{tSearch('allTools')}</>}
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-slate-700 dark:text-slate-300">
              {categoryDesc || tSearch('subtitle')}
            </p>
          </div>

          <div className="mb-12 relative max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                id="search"
                className="block w-full p-3 pl-10 text-md border-none ring-1 ring-slate-300 dark:ring-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
                placeholder={tSearch('searchPlaceholder')}
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    if (categoryParam) {
                      router.push(`/${locale}/search/${categoryParam}`);
                    } else {
                      router.push(`/${locale}/search`);
                    }
                  }}
                  className="absolute inset-y-0 right-12 flex items-center pr-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white bg-primary-500 hover:bg-primary-600 rounded-r-lg px-4"
              >
                <span className="sr-only">{tSearch('searchAction')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Breadcrumb
                ariaLabel={tSearch('breadcrumbLabel')}
                items={[
                  { label: tCommon('home'), href: '/' },
                  { label: searchQuery ? tSearch('results') : (categoryName || tSearch('allTools')) }
                ]}
              />

              {(searchQuery || categoryParam) && (
                <div className="flex flex-wrap gap-2">
                  {categoryParam && categoryName && (
                    <FilterChip
                      prefix={tSearch('categoryPrefix')}
                      label={categoryName}
                      onRemove={() => {
                        if (searchQuery) {
                          router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`);
                        } else {
                          router.push(`/${locale}`);
                        }
                      }}
                    />
                  )}
                  {searchQuery && (
                    <FilterChip
                      prefix={tSearch('searchPrefix')}
                      label={searchQuery}
                      onRemove={() => {
                        if (categoryParam) {
                          router.push(`/${locale}/search/${categoryParam}`);
                        } else {
                          router.push(`/${locale}`);
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <ToolSortControls currentSort={sortMethod} onSortChange={handleSortChange} />
            </div>

            <ToolList
              tools={sortedTools}
              initialSearchQuery={searchQuery}
              isLoading={isLoading}
              error={error}
              selectedToolCategory={categoryParam}
            />
          </div>

          {(searchQuery || categoryParam) && (
            <div className="relative z-20 mt-8 flex justify-center">
              <CopyButton
                text={shareData.link}
                label={tSearch('shareResults')}
                copiedLabel={tSearch('linkCopied')}
                enableNativeShare
                preferWechatLaunch
                wechatShareReady={isWeChat && wechatShareReady}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
