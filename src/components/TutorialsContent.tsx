"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { tutorials, Tutorial, sortTutorials, TutorialSortMethod, DifficultyLevel } from '@/data/tutorials';
import { localizeTutorialCategory } from '@/utils/tutorials';
import TutorialCard from './TutorialCard';
import TutorialImportGate from '@/components/tutorials/TutorialImportGate';
import { useAdminSession } from '@/hooks/useAdminSession';
import {
  type CoreScenarioId,
  getCoreScenarioAliases,
  getCoreScenarioIds,
  getTutorialHiddenTaxonomyTags,
  getTutorialSearchAliasTokens,
  matchesTaxonomyToken,
  serializeTagsForTelemetry,
} from '@/lib/coreTaxonomy';
import { setTag, trackUserAction } from '@/utils/clarity';

/**
 * 教程列表内容组件
 */
export default function TutorialsContent() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [categoryFilter, setCategoryFilter] = useState<CoreScenarioId | ''>('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | ''>('');
  const [sortMethod, setSortMethod] = useState<TutorialSortMethod>('latest');
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { authenticated: canManageTutorials } = useAdminSession();
  const text = useMemo(() => ({
    title: isEn ? 'Starter Tutorials' : '萌新教程',
    subtitle: isEn
      ? 'Personal write-ups from AI practitioners, sharing practical tips, hands-on workflows, and real use cases.'
      : '来自AI践行者们的个人写作，分享AI工具的使用技巧、实战经验和创新应用',
    importTitle: isEn ? 'Import article' : '导入文章',
    allTutorials: isEn ? 'All Tutorials' : '全部教程',
    beginner: isEn ? 'Beginner' : '小白入门',
    intermediate: isEn ? 'Intermediate' : '萌新进阶',
    advanced: isEn ? 'Advanced' : '高端玩家',
    searchPlaceholder: isEn ? 'Search tutorial title, description, or author...' : '搜索教程标题、描述或作者...',
    sortLatest: isEn ? 'Newest first' : '最新优先',
    sortOldest: isEn ? 'Oldest first' : '最早优先',
    sortDifficulty: isEn ? 'Easy to hard' : '从易到难',
    categoryTitle: isEn ? 'Core Scenarios' : '核心场景',
    allCategories: isEn ? 'All Scenarios' : '全部场景',
    resultCount: (count: number) => (isEn ? `Found ${count} matching tutorials` : `找到 ${count} 个符合条件的教程`),
    resetFilters: isEn ? 'Reset Filters' : '重置筛选',
    noResultTitle: isEn ? 'No matching tutorials found' : '未找到匹配的教程',
    noResultHint: isEn ? 'Try different keywords or filters.' : '请尝试其他搜索词或筛选条件',
    resetAll: isEn ? 'Reset All Filters' : '重置所有筛选',
    deleteConfirm: isEn ? 'Are you sure you want to delete this tutorial?' : '确定要删除这篇教程吗？',
    deleteSuccess: isEn ? 'Deleted successfully!' : '删除成功！',
    deleteFailedPrefix: isEn ? 'Delete failed:' : '删除失败:',
    deleteRequestError: isEn ? 'Delete request failed' : '删除请求发生错误',
    inputLink: isEn ? 'Please enter a link' : '请输入链接',
    extractFailed: isEn ? 'Extraction failed' : '提取失败',
    autoFilled: isEn ? 'Article metadata auto-filled. Please review and save.' : '已自动填充文章信息，请核对后保存。',
    requestFailed: isEn ? 'Request failed' : '请求失败',
    networkOrLinkError: isEn
      ? 'Request failed. Check network connection or link validity.'
      : '请求失败，请检查网络连接或链接有效性。',
    requiredLinkTitle: isEn ? 'Link and title are required' : '链接和标题不能为空',
    saveFailed: isEn ? 'Save failed' : '保存失败',
    saveFailedRetry: isEn ? 'Save failed, please try again later' : '保存失败，请稍后再试',
    addedSuccess: isEn ? 'Added to tutorial data' : '已添加到教程数据中',
    importPanelTitle: isEn ? 'WeChat article import (internal)' : '微信公众号文章导入（内部使用）',
    articleLinkLabel: isEn ? 'Article link (WeChat only)' : '文章链接（仅支持微信公众号）',
    extracting: isEn ? 'Extracting...' : '提取中...',
    extractInfo: isEn ? 'Extract info' : '提取信息',
    fieldTitle: isEn ? 'Title' : '标题',
    fieldAuthor: isEn ? 'Author' : '作者',
    fieldDate: isEn ? 'Publish date (YYYY-MM-DD)' : '发布日期（YYYY-MM-DD）',
    fieldCategory: isEn ? 'Category (auto-detected, editable)' : '分类（自动匹配，可手动修改）',
    chooseCategory: isEn ? 'Select category' : '请选择分类',
    fieldDifficulty: isEn ? 'Difficulty' : '难度',
    fieldCover: isEn ? 'Cover URL (optional)' : '封面图 URL（可为空）',
    fieldSummary: isEn ? 'Summary / Recommendation' : '摘要 / 推荐理由',
    fieldSkills: isEn ? 'Skill tags (comma-separated)' : '技能标签（用逗号分隔）',
    skillPlaceholder: isEn ? 'Example: DeepSeek, AI design' : '例如：DeepSeek, AI绘画',
    saving: isEn ? 'Saving...' : '保存中...',
    confirmAdd: isEn ? 'Add to tutorial data' : '确认添加到教程数据',
  }), [isEn]);

  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formPublishDate, setFormPublishDate] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formCover, setFormCover] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('萌新进阶');
  const [formSkillTags, setFormSkillTags] = useState('');

  // 只展示核心场景标签（显性）
  const categories = getCoreScenarioIds().filter((scenarioId) =>
    tutorials.some((tutorial) => tutorial.coreScenarios.includes(scenarioId))
  );
  
  // 当URL参数变化时更新搜索查询
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (searchParams.get('import') === '1') {
      setShowImportForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const hiddenTutorialTags = tutorials.flatMap((tutorial) => getTutorialHiddenTaxonomyTags(tutorial));
    setTag('taxonomy_version', 'difficulty-scenario-v1');
    setTag('hidden_tutorial_tag_count', String(new Set(hiddenTutorialTags).size));
    setTag('hidden_tutorial_tags_sample', serializeTagsForTelemetry(hiddenTutorialTags));
  }, []);

  // 自动根据标题/摘要匹配一个默认分类
  const guessCategory = (title: string, summary: string): string => {
    if (!categories.length) return '';
    const text = `${title} ${summary}`.toLowerCase();
    const matched = categories.find((scenarioId) =>
      getCoreScenarioAliases(scenarioId).some((alias) => text.includes(alias.toLowerCase()))
    );
    return matched || categories[0];
  };

  const handleFetchWechat = async () => {
    if (!importUrl) {
      setImportError(text.inputLink);
      return;
    }

    try {
      setImportLoading(true);
      setImportError('');
      setSaveMessage('');

      const res = await fetch(`/api/proxy/article?url=${encodeURIComponent(importUrl.trim())}`);
      const data = await res.json();

      if (!data.success) {
        setImportError(data.message || text.extractFailed);
        return;
      }

      const meta: { title?: string; summary?: string; author?: string; publishDate?: string; cover?: string } = data.data;
      setFormTitle(meta.title || '');
      setFormSummary(meta.summary || '');
      setFormAuthor(meta.author || '');
      setFormPublishDate(meta.publishDate || new Date().toISOString().split('T')[0]);
      setFormCover(meta.cover || '');

      const guessed = guessCategory(meta.title || '', meta.summary || '');
      setFormCategory(guessed);
      setFormDifficulty('萌新进阶');
      setFormSkillTags('');

      setSaveMessage(text.autoFilled);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : text.requestFailed;
      setImportError(`${text.networkOrLinkError} (${errorMessage})`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveTutorial = async () => {
    setImportError('');
    setSaveMessage('');
    if (!formTitle || !importUrl) {
      setImportError(text.requiredLinkTitle);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/tutorials/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: importUrl,
          title: formTitle,
          author: formAuthor,
          publishDate: formPublishDate,
          summary: formSummary,
          cover: formCover,
          category: formCategory,
          difficultyLevel: formDifficulty,
          skillTags: formSkillTags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setImportError(data.message || text.saveFailed);
        return;
      }
      setSaveMessage(data.message || text.addedSuccess);
      
      // 如果是本地环境，可以尝试手动更新列表（可选）
      // 但因为是静态数据，最好还是提示重新部署
    } catch {
      setImportError(text.saveFailedRetry);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteTutorial = async (id: string) => {
    if (deletingId) return;
    if (!window.confirm(text.deleteConfirm)) return;
    setDeletingId(id);
    setSaveMessage('');
    setImportError('');
    try {
      const res = await fetch('/api/tutorials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        setSaveMessage(data.message || text.deleteSuccess);
        setFilteredTutorials(prev => prev.filter(t => t.id !== id));
      } else {
        setImportError(`${text.deleteFailedPrefix} ${data.message}`);
      }
    } catch {
      setImportError(text.deleteRequestError);
    } finally {
      setDeletingId(null);
    }
  };

  // 筛选和排序教程
  useEffect(() => {
    let filtered = tutorials;
    
    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tutorial => 
        tutorial.title.toLowerCase().includes(query) || 
        tutorial.description.toLowerCase().includes(query) ||
        tutorial.author.toLowerCase().includes(query) ||
        matchesTaxonomyToken(query, getTutorialSearchAliasTokens(tutorial))
      );
    }
    
    // 场景筛选
    if (categoryFilter) {
      filtered = filtered.filter(tutorial => tutorial.coreScenarios.includes(categoryFilter));
    }
    
    // 难度筛选
    if (difficultyFilter) {
      filtered = filtered.filter(tutorial => tutorial.difficultyLevel === difficultyFilter);
    }
    
    // 排序
    filtered = sortTutorials(filtered, sortMethod);
    
    setFilteredTutorials(filtered);
  }, [searchQuery, categoryFilter, difficultyFilter, sortMethod]);

  useEffect(() => {
    trackUserAction('tutorial_filter_change', {
      tutorial_difficulty: difficultyFilter || 'all',
      tutorial_scenario: categoryFilter || 'all',
      tutorial_sort: sortMethod,
    });
  }, [categoryFilter, difficultyFilter, sortMethod]);
  
  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900">
      {/* 背景装饰 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
      
      <div className="page-shell relative z-10 py-6">
        <div className="max-w-8xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-6 relative group">
            <h1 className="text-3xl font-bold font-serif mb-2 text-gray-900 dark:text-white inline-flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
                {text.title}
              </span>
              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className="opacity-30 hover:opacity-100 transition-opacity text-gray-400 hover:text-primary-500 p-2"
                title={text.importTitle}
              >
                <i className="fas fa-magic text-lg"></i>
              </button>
            </h1>
            <p className="text-md text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              {text.subtitle}
            </p>
          </div>

          {/* 管理导入区域 */}
          {showImportForm && (
            <div className="mb-6">
              <TutorialImportGate locale={isEn ? 'en' : 'zh'}>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-dashed border-primary-200 dark:border-primary-700/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                      <i className="fas fa-magic mr-2 text-primary-500"></i>
                      {text.importPanelTitle}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {text.articleLinkLabel}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="https://mp.weixin.qq.com/..."
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !importLoading) {
                              e.preventDefault();
                              handleFetchWechat();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 relative z-20"
                          onClick={handleFetchWechat}
                          disabled={importLoading}
                        >
                          {importLoading ? text.extracting : text.extractInfo}
                        </button>
                      </div>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {text.fieldTitle}
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {text.fieldAuthor}
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {text.fieldDate}
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                      value={formPublishDate}
                      onChange={(e) => setFormPublishDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {text.fieldCategory}
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="">{text.chooseCategory}</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {localizeTutorialCategory(c, isEn ? 'en' : 'zh')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {text.fieldDifficulty}
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                      value={formDifficulty}
                      onChange={(e) =>
                        setFormDifficulty(e.target.value as DifficultyLevel)
                      }
                    >
                      <option value="小白入门">{text.beginner}</option>
                      <option value="萌新进阶">{text.intermediate}</option>
                      <option value="高端玩家">{text.advanced}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {text.fieldCover}
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                      value={formCover}
                      onChange={(e) => setFormCover(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {text.fieldSummary}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                    rows={3}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {text.fieldSkills}
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100"
                    value={formSkillTags}
                    onChange={(e) => setFormSkillTags(e.target.value)}
                    placeholder={text.skillPlaceholder}
                  />
                </div>

                {importError && (
                  <p className="text-xs text-red-500 mt-1">{importError}</p>
                )}
                {saveMessage && (
                  <p className="text-xs text-emerald-600 mt-1">{saveMessage}</p>
                )}

                    <div className="flex justify-end mt-2">
                      <button
                        className="px-4 py-2 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
                        onClick={handleSaveTutorial}
                        disabled={saving}
                      >
                        {saving ? text.saving : text.confirmAdd}
                      </button>
                    </div>
                  </div>
                </div>
              </TutorialImportGate>
            </div>
          )}
          
          {/* 1. 难度筛选选项卡 - 整体样式优化，更贴近图片 */}
          <div className="mb-6">
            <div className="flex justify-center">
              <div className="hide-scrollbar flex w-full max-w-4xl gap-2 overflow-x-auto rounded-lg sm:overflow-hidden sm:gap-0 sm:shadow-sm">
                {/* 全部 - 深色背景 */}
                <button
                  className={`inline-flex min-w-[132px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors sm:min-w-0 sm:rounded-none ${
                    difficultyFilter === '' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setDifficultyFilter('')}
                >
                  <i className="fas fa-th-large mr-2"></i>
                  {text.allTutorials}
                </button>
                
                {/* 小白入门 - 绿色背景 */}
                <button
                  key="小白入门"
                  className={`inline-flex min-w-[132px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors sm:min-w-0 sm:rounded-none ${
                    difficultyFilter === '小白入门' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-green-50 text-gray-700 hover:bg-green-100'
                  }`}
                  onClick={() => setDifficultyFilter('小白入门')}
                >
                  <i className="fas fa-seedling mr-2 text-green-600"></i>
                  {text.beginner}
                </button>
                
                {/* 萌新进阶 - 蓝色背景 */}
                <button
                  key="萌新进阶"
                  className={`inline-flex min-w-[132px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors sm:min-w-0 sm:rounded-none ${
                    difficultyFilter === '萌新进阶'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-primary-50 text-gray-700 hover:bg-primary-100'
                  }`}
                  onClick={() => setDifficultyFilter('萌新进阶')}
                >
                  <i className="fas fa-graduation-cap mr-2 text-primary-600"></i>
                  {text.intermediate}
                </button>
                
                {/* 高端玩家 - 紫色背景 */}
                <button
                  key="高端玩家"
                  className={`inline-flex min-w-[132px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors sm:min-w-0 sm:rounded-none ${
                    difficultyFilter === '高端玩家' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-purple-50 text-gray-700 hover:bg-purple-100'
                  }`}
                  onClick={() => setDifficultyFilter('高端玩家')}
                >
                  <i className="fas fa-crown mr-2 text-purple-600"></i>
                  {text.advanced}
                </button>
              </div>
            </div>
          </div>
          
          {/* 2. 搜索栏和排序选项合并一行 */}
          <div className="mb-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* 搜索框 */}
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all" 
                  placeholder={text.searchPlaceholder}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <i className="fas fa-search"></i>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
              
              {/* 排序下拉菜单 */}
              <div className="flex-shrink-0 md:w-48">
                <div className="relative">
                  <select
                    value={sortMethod}
                    onChange={(e) => setSortMethod(e.target.value as TutorialSortMethod)}
                    className="w-full py-2 px-4 pr-8 appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
                  >
                    <option value="latest">{text.sortLatest}</option>
                    <option value="oldest">{text.sortOldest}</option>
                    <option value="difficulty-asc">{text.sortDifficulty}</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <i className="fas fa-sort"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. 核心场景标签（显性） */}
          <div className="mb-6 space-y-4">
            {/* 核心场景 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <i className="fas fa-folder mr-2 text-primary-500"></i>
                  {text.categoryTitle}
                </h3>
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                <button 
                  className={`scenario-chip inline-flex min-w-[88px] shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    !categoryFilter ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={{ whiteSpace: 'nowrap', writingMode: 'horizontal-tb', textOrientation: 'mixed', minWidth: '88px' }}
                  onClick={() => setCategoryFilter('')}
                >
                  <span className="inline-block whitespace-nowrap">{text.allCategories}</span>
                </button>
                {categories.map(category => (
                  <button 
                    key={category}
                    className={`scenario-chip inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      categoryFilter === category ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={{ whiteSpace: 'nowrap', writingMode: 'horizontal-tb', textOrientation: 'mixed' }}
                    onClick={() => setCategoryFilter(category)}
                  >
                    <span className="inline-block whitespace-nowrap">{localizeTutorialCategory(category, isEn ? 'en' : 'zh')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 结果计数 */}
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {text.resultCount(filteredTutorials.length)}
            </div>
            
            {/* 重置按钮 */}
            {(searchQuery || categoryFilter || difficultyFilter || sortMethod !== 'latest') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setDifficultyFilter('');
                  setSortMethod('latest');
                }}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors flex items-center"
              >
                <i className="fas fa-undo-alt mr-1"></i>
                {text.resetFilters}
              </button>
            )}
          </div>
          
          {/* 教程列表 - 移动端使用紧凑网格布局 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredTutorials.map(tutorial => (
              <div key={tutorial.id}>
                <TutorialCard 
                  tutorial={tutorial} 
                  showDelete={showImportForm && canManageTutorials} 
                  onDelete={handleDeleteTutorial}
                  showRecommendReason={true}
                />
              </div>
            ))}
          </div>
          
          {/* 没有结果时显示提示 */}
          {filteredTutorials.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                <i className="fas fa-search text-neutral-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">{text.noResultTitle}</h3>
              <p className="text-base text-neutral-500 dark:text-neutral-400">{text.noResultHint}</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setDifficultyFilter('');
                  setSortMethod('latest');
                }}
                className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <i className="fas fa-redo mr-2"></i>
                {text.resetAll}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
