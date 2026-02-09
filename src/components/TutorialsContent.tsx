"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { tutorials, Tutorial, sortTutorials, TutorialSortMethod, DifficultyLevel } from '@/data/tutorials';
import { useMediaQuery } from '@/hooks/useMediaQuery'; // 引入媒体查询钩子
import DifficultyBadge from './DifficultyBadge';
import SkillTag from './SkillTag';
import { getCategoryColor } from '@/utils/tutorials';

/**
 * 教程标签组件
 */
const TutorialTag = ({ category }: { category: string }) => (
  <span className={`px-2 py-0.5 ${getCategoryColor(category)} text-white text-xs font-medium rounded-md`}>
    {category}
  </span>
);

/**
 * 教程卡片组件 - 优化移动端交互和布局
 */
const TutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 触摸反馈效果
  const handleTouchStart = () => {
    if (isMobile && cardRef.current) {
      cardRef.current.style.transform = 'scale(0.98)';
      cardRef.current.style.opacity = '0.9';
    }
  };
  
  const handleTouchEnd = () => {
    if (isMobile && cardRef.current) {
      cardRef.current.style.transform = 'scale(1)';
      cardRef.current.style.opacity = '1';
    }
  };

  return (
    <a 
      href={tutorial.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block h-full group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <article 
        ref={cardRef}
        className="tool-card bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary-300 border border-transparent"
        style={{ transition: 'transform 0.2s, opacity 0.2s' }}
      >
        <div className={`relative w-full ${isMobile ? 'h-28' : 'h-36'} overflow-hidden bg-gradient-to-r from-gray-100 to-slate-200 dark:from-gray-800 dark:to-slate-900`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Image 
              src={tutorial.imageUrl} 
              alt={tutorial.title} 
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 288px"
              className="object-cover transform group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cmVjdCBpZD0iciIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiNmNGY0ZjUiIC8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIwLjU7MTswLjUiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPjwvc3ZnPg=="
              onError={(e) => {
                // 图片加载失败时使用CSS生成的占位图
                const target = e.target as HTMLImageElement;
                // 使用一个默认的渐变背景作为图片
                target.onerror = null; // 防止无限循环
                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="288" height="144" viewBox="0 0 288 144"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:%23764ba2;stop-opacity:1" /></linearGradient></defs><rect width="288" height="144" fill="url(%23grad)" /><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">教程图片</text></svg>';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-2 right-2 z-10">
            <DifficultyBadge level={tutorial.difficultyLevel} size="sm" />
          </div>
          <div className="absolute bottom-2 left-2 z-10">
            <TutorialTag category={tutorial.category} />
          </div>
        </div>
        <div className={`${isMobile ? 'p-2' : 'p-3'} flex-grow`}>
          <h3 className={`font-bold ${isMobile ? 'text-sm' : 'text-base'} mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200`}>{tutorial.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-y-1 mb-1">
            <span className="flex items-center mr-2">
              <i className="fas fa-calendar-alt mr-1"></i>
              {tutorial.publishDate}
            </span>
            <span className="flex items-center">
              <i className="fas fa-user-edit mr-1"></i>
              {tutorial.author}
            </span>
          </p>
          
          {/* 技能标签 */}
          {tutorial.skillTags && tutorial.skillTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tutorial.skillTags.slice(0, 2).map((tag, index) => (
                <SkillTag key={index} tag={tag} />
              ))}
              {tutorial.skillTags.length > 2 && (
                <span className="text-xs text-gray-500">+{tutorial.skillTags.length - 2}</span>
              )}
            </div>
          )}
          
          {/* 推荐理由 */}
          {tutorial.recommendReason && (
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded line-clamp-3 italic">
              <i className="fas fa-thumbs-up text-primary-500 mr-1"></i>
              {tutorial.recommendReason}
            </div>
          )}
          
          <div className={`text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center ${isMobile ? '' : 'group-hover:translate-x-1'} transition-transform duration-300 mt-1`}>
            阅读全文
            <i className={`fas fa-arrow-right ml-1 ${isMobile ? '' : 'group-hover:ml-2'} transition-all duration-300`}></i>
          </div>
        </div>
      </article>
    </a>
  );
};

/**
 * 教程列表内容组件
 */
export default function TutorialsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | ''>('');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [sortMethod, setSortMethod] = useState<TutorialSortMethod>('latest');
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [showImportForm, setShowImportForm] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formPublishDate, setFormPublishDate] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formCover, setFormCover] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('萌新进阶');
  const [formSkillTags, setFormSkillTags] = useState('');

  // 获取所有分类
  const categories = Array.from(new Set(tutorials.map(tutorial => tutorial.category)));
  
  // 获取所有技能标签
  const allSkillTags = Array.from(
    new Set(
      tutorials.flatMap(tutorial => tutorial.skillTags || [])
    )
  ).sort();
  
  // 当URL参数变化时更新搜索查询
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // 自动根据标题/摘要匹配一个默认分类
  const guessCategory = (title: string, summary: string): string => {
    if (!categories.length) return '';
    const text = `${title} ${summary}`;
    const matched = categories.find(c => c && text.includes(c));
    return matched || categories[0];
  };

  const handleFetchWechat = async () => {
    console.log('>>> handleFetchWechat called', { importUrl });
    if (!importUrl) {
      alert('请输入链接');
      return;
    }
    
    try {
      setImportLoading(true);
      setImportError('');
      setSaveMessage('');
      
      const targetUrl = `/api/proxy/article?url=${encodeURIComponent(importUrl.trim())}`;
      console.log('Fetching:', targetUrl);

      const res = await fetch(targetUrl);
      console.log('Response status:', res.status);

      const data = await res.json();
      console.log('Response data:', data);

      if (!data.success) {
        const msg = data.message || '提取失败';
        setImportError(msg);
        alert(`提取失败: ${msg}`);
        return;
      }

      const meta = data.data;
      setFormTitle(meta.title || '');
      setFormSummary(meta.summary || '');
      setFormAuthor(meta.author || '');
      setFormPublishDate(meta.publishDate || new Date().toISOString().split('T')[0]);
      setFormCover(meta.cover || '');
      
      const guessed = guessCategory(meta.title || '', meta.summary || '');
      setFormCategory(guessed);
      setFormDifficulty('萌新进阶');
      setFormSkillTags('');
      
      setSaveMessage('已自动填充文章信息，请核对后保存。');
      alert('提取成功！请检查下方表单内容。');
    } catch (error: unknown) {
      console.error('Fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : '请求失败';
      setImportError(errorMessage);
      alert(`发生错误: ${errorMessage}\n\n可能原因：\n1. 网络连接问题\n2. 链接无效\n3. 浏览器插件拦截`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveTutorial = async () => {
    setImportError('');
    setSaveMessage('');
    if (!formTitle || !importUrl) {
      setImportError('链接和标题不能为空');
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
        setImportError(data.message || '保存失败');
        return;
      }
      setSaveMessage('已添加到教程数据中，记得重新构建/部署后生效。');
    } catch (error) {
      console.error(error);
      setImportError('保存失败，请稍后再试');
    } finally {
      setSaving(false);
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
        tutorial.author.toLowerCase().includes(query)
      );
    }
    
    // 分类筛选
    if (categoryFilter) {
      filtered = filtered.filter(tutorial => tutorial.category === categoryFilter);
    }
    
    // 难度筛选
    if (difficultyFilter) {
      filtered = filtered.filter(tutorial => tutorial.difficultyLevel === difficultyFilter);
    }
    
    // 技能筛选
    if (skillFilter) {
      filtered = filtered.filter(tutorial => 
        tutorial.skillTags && tutorial.skillTags.some(tag => tag === skillFilter)
      );
    }
    
    // 排序
    filtered = sortTutorials(filtered, sortMethod);
    
    setFilteredTutorials(filtered);
  }, [searchQuery, categoryFilter, difficultyFilter, skillFilter, sortMethod]);
  
  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900">
      {/* 背景装饰 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-3 sm:px-4 py-6 relative z-10">
        <div className="max-w-8xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-6 relative group">
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white inline-flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                萌新教程
              </span>
              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className="opacity-30 hover:opacity-100 transition-opacity text-slate-400 hover:text-primary-500 p-2"
                title="导入文章"
              >
                <i className="fas fa-magic text-lg"></i>
              </button>
            </h1>
            <p className="text-md text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
              来自AI践行者们的个人写作，分享AI工具的使用技巧、实战经验和创新应用
            </p>
          </div>

          {/* 管理导入区域 */}
          {showImportForm && (
            <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-dashed border-primary-200 dark:border-primary-700/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                  <i className="fas fa-magic mr-2 text-primary-500"></i>
                  微信公众号文章导入（内部使用）
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    文章链接（仅支持微信公众号）
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://mp.weixin.qq.com/..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 relative z-20"
                      onClick={() => {
                        console.log('Force click check');
                        handleFetchWechat();
                      }}
                      disabled={importLoading}
                    >
                      {importLoading ? '提取中...' : '提取信息'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      标题
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      作者
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      发布日期（YYYY-MM-DD）
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                      value={formPublishDate}
                      onChange={(e) => setFormPublishDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      分类（自动匹配，可手动修改）
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="">请选择分类</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      难度
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                      value={formDifficulty}
                      onChange={(e) =>
                        setFormDifficulty(e.target.value as DifficultyLevel)
                      }
                    >
                      <option value="小白入门">小白入门</option>
                      <option value="萌新进阶">萌新进阶</option>
                      <option value="高端玩家">高端玩家</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      封面图 URL（可为空）
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                      value={formCover}
                      onChange={(e) => setFormCover(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    摘要 / 推荐理由
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                    rows={3}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    技能标签（用逗号分隔）
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                    value={formSkillTags}
                    onChange={(e) => setFormSkillTags(e.target.value)}
                    placeholder="例如：DeepSeek, AI绘画"
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
                    {saving ? '保存中...' : '确认添加到教程数据'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 1. 难度筛选选项卡 - 整体样式优化，更贴近图片 */}
          <div className="mb-6">
            <div className="flex justify-center">
              <div className="flex w-full max-w-4xl rounded-lg shadow-sm overflow-hidden">
                {/* 全部 - 深色背景 */}
                <button
                  className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors flex items-center justify-center ${
                    difficultyFilter === '' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setDifficultyFilter('')}
                >
                  <i className="fas fa-th-large mr-2"></i>
                  全部教程
                </button>
                
                {/* 小白入门 - 绿色背景 */}
                <button
                  key="小白入门"
                  className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors flex items-center justify-center ${
                    difficultyFilter === '小白入门' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-green-50 text-gray-700 hover:bg-green-100'
                  }`}
                  onClick={() => setDifficultyFilter('小白入门')}
                >
                  <i className="fas fa-seedling mr-2 text-green-600"></i>
                  小白入门
                </button>
                
                {/* 萌新进阶 - 蓝色背景 */}
                <button
                  key="萌新进阶"
                  className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors flex items-center justify-center ${
                    difficultyFilter === '萌新进阶' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-blue-50 text-gray-700 hover:bg-blue-100'
                  }`}
                  onClick={() => setDifficultyFilter('萌新进阶')}
                >
                  <i className="fas fa-graduation-cap mr-2 text-blue-600"></i>
                  萌新进阶
                </button>
                
                {/* 高端玩家 - 紫色背景 */}
                <button
                  key="高端玩家"
                  className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors flex items-center justify-center ${
                    difficultyFilter === '高端玩家' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-purple-50 text-gray-700 hover:bg-purple-100'
                  }`}
                  onClick={() => setDifficultyFilter('高端玩家')}
                >
                  <i className="fas fa-crown mr-2 text-purple-600"></i>
                  高端玩家
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
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all" 
                  placeholder="搜索教程标题、描述或作者..."
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="fas fa-search"></i>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                    className="w-full py-2 px-4 pr-8 appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
                  >
                    <option value="latest">最新优先</option>
                    <option value="oldest">最早优先</option>
                    <option value="difficulty-asc">从易到难</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <i className="fas fa-sort"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. 分类系统分层 */}
          <div className="mb-6 space-y-4">
            {/* 主要分类 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <i className="fas fa-folder mr-2 text-primary-500"></i>
                内容分类
              </h3>
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                <button 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    !categoryFilter ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => setCategoryFilter('')}
                >
                  全部分类
                </button>
                {categories.map(category => (
                  <button 
                    key={category}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === category ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 工具/技能标签 */}
            {allSkillTags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <i className="fas fa-tags mr-2 text-primary-500"></i>
                  工具/技能标签
                </h3>
                <div className="flex flex-wrap gap-2 overflow-x-auto py-1 no-scrollbar">
                  <button 
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      !skillFilter ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setSkillFilter('')}
                  >
                    全部技能
                  </button>
                  {allSkillTags.map(tag => (
                    <button 
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        skillFilter === tag ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setSkillFilter(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 结果计数 */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              找到 <span className="font-medium">{filteredTutorials.length}</span> 个符合条件的教程
            </div>
            
            {/* 重置按钮 */}
            {(searchQuery || categoryFilter || difficultyFilter || skillFilter || sortMethod !== 'latest') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setDifficultyFilter('');
                  setSkillFilter('');
                  setSortMethod('latest');
                }}
                className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors flex items-center"
              >
                <i className="fas fa-undo-alt mr-1"></i>
                重置筛选
              </button>
            )}
          </div>
          
          {/* 教程列表 - 移动端使用紧凑网格布局 */}
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-2' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'}`}>
            {filteredTutorials.map(tutorial => (
              <div key={tutorial.id}>
                <TutorialCard tutorial={tutorial} />
              </div>
            ))}
          </div>
          
          {/* 没有结果时显示提示 */}
          {filteredTutorials.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mt-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                <i className="fas fa-search text-neutral-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">未找到匹配的教程</h3>
              <p className="text-base text-neutral-500 dark:text-neutral-400">请尝试其他搜索词或筛选条件</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setDifficultyFilter('');
                  setSkillFilter('');
                  setSortMethod('latest');
                }}
                className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <i className="fas fa-redo mr-2"></i>
                重置所有筛选
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
