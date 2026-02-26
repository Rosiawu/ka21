'use client';

// import Image from 'next/image'; // 移除 Image 导入
import { LLMArticle } from '@/data/llm-articles';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import SkillTag from './SkillTag';
import { usePathname } from 'next/navigation';

export default function LLMArticleCard({ article }: { article: LLMArticle }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const categoryLabel =
    isEn
      ? (
        article.category === '大模型介绍'
          ? 'LLM Intro'
          : article.category === '模型对比'
            ? 'Model Comparison'
            : article.category === '技术分析'
              ? 'Technical Analysis'
              : article.category
      )
      : article.category;
  
  // 根据文章分类获取背景颜色或样式
  const getBackgroundStyle = (category: LLMArticle['category']) => {
    switch (category) {
      case '大模型介绍':
        return 'bg-blue-500'; // 蓝色背景
      case '模型对比':
        return 'bg-purple-500'; // 紫色背景
      case '技术分析':
        return 'bg-green-500'; // 绿色背景
      default:
        return 'bg-gray-500'; // 默认灰色背景
    }
  };

  return (
    <a 
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full group"
    >
      <article className="tool-card bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary-300 border border-transparent">
        {/* 封面区域，根据分类动态设置背景 */}
        <div className={`relative w-full aspect-[2/1] overflow-hidden flex items-center justify-center ${getBackgroundStyle(article.category)}`}>
          {/* 这里可以根据需要添加图标或其他装饰元素 */}
          <span className="text-white text-xl font-bold">
            {categoryLabel}
          </span>
          <div className="absolute bottom-2 left-2 z-10">
            {/* 分类徽章已包含在背景中，这里不再需要 */}
            {/* <span className={`px-2 py-0.5 ${getBackgroundStyle(article.category)} text-white text-xs font-medium rounded-md`}>
              {article.category}
            </span> */}
          </div>
        </div>
        
        <div className="p-4 flex-grow">
          <h3 className={`font-bold ${isMobile ? 'text-sm' : 'text-base'} mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200`}>
            {article.title}
          </h3>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-y-1 mb-1">
            <span className="flex items-center mr-2">
              <i className="fas fa-calendar-alt mr-1"></i>
              {article.publishDate}
            </span>
            <span className="flex items-center">
              <i className="fas fa-user-edit mr-1"></i>
              {article.author}
            </span>
          </p>
          
          {/* 技能标签 */}
          {article.skillTags && article.skillTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {article.skillTags.slice(0, 2).map((tag, index) => (
                <SkillTag key={index} tag={tag} />
              ))}
              {article.skillTags.length > 2 && (
                <span className="text-xs text-gray-500">+{article.skillTags.length - 2}</span>
              )}
            </div>
          )}
          
          {/* 推荐理由 */}
          {article.recommendReason && (
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded line-clamp-3 italic">
              <i className="fas fa-thumbs-up text-primary-500 mr-1"></i>
              {article.recommendReason}
            </div>
          )}
          
          <div className={`text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center ${isMobile ? '' : 'group-hover:translate-x-1'} transition-transform duration-300 mt-1`}>
            {isEn ? 'Read more' : '阅读全文'}
            <i className={`fas fa-arrow-right ml-1 ${isMobile ? '' : 'group-hover:ml-2'} transition-all duration-300`}></i>
          </div>
        </div>
      </article>
    </a>
  );
} 
