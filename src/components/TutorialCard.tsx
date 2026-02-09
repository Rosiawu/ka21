"use client"; // 标记为客户端组件，可以在浏览器中运行

import Image from 'next/image'; // 引入Next.js优化的图片组件
import { Tutorial } from '@/data/tutorials'; // 引入教程数据类型定义
import { getCategoryColor } from '@/utils/tutorials'; // 引入获取分类颜色的工具函数
import {useTranslations} from 'next-intl';

// 定义教程卡片组件的属性接口
interface TutorialCardProps {
  tutorial: Tutorial; // 教程数据对象
}

/**
 * 通用教程卡片组件（统一用于搜索页等场景）
 * - 保持原有布局与样式不变
 * - 仅抽离以减少重复
 * - 支持响应式设计和暗色模式
 * 
 * @param tutorial 教程数据对象
 * @returns JSX元素
 */
export default function TutorialCard({ tutorial }: TutorialCardProps) {
  // 使用 Home 命名空间中的“阅读全文”文案，保持与首页一致
  const tHome = useTranslations('Home');
  return (
    // 外层链接容器，点击整个卡片跳转到教程页面
    <a
      href={tutorial.url} // 教程的外部链接地址
      target="_blank" // 在新标签页中打开链接
      rel="noopener noreferrer" // 安全属性，防止新页面访问原页面
      className="block h-full group" // CSS类：块级元素、占满高度、组状态
    >
      {/* 教程卡片主体容器 */}
      <article className="tool-card bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary-300 border border-transparent">
        {/* 图片区域容器 */}
        <div className="relative w-full h-40 overflow-hidden bg-gradient-to-r from-gray-100 to-slate-200 dark:from-gray-800 dark:to-slate-900">
          {/* 图片居中容器 */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Next.js优化的图片组件 */}
            <Image
              src={tutorial.imageUrl} // 教程封面图片URL
              alt={tutorial.title} // 图片替代文本，用于无障碍访问
              fill // 填充父容器
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px" // 响应式图片尺寸
              className="object-cover transform group-hover:scale-105 transition-transform duration-500" // 图片样式：覆盖填充、悬停缩放效果
              loading="lazy" // 懒加载，提升页面性能
              placeholder="blur" // 显示模糊占位符
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cmVjdCBpZD0iciIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiNmNGY0ZjUiIC8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIwLjU7MTswLjUiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPjwvc3ZnPg==" // Base64编码的SVG占位符
              onError={(e) => { // 图片加载失败时的处理函数
                const target = e.target as HTMLImageElement; // 获取图片元素
                target.onerror = null; // 防止无限循环错误
                target.src = 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"160\" viewBox=\"0 0 320 160\"><defs><linearGradient id=\"grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" style=\"stop-color:%23667eea;stop-opacity:1\" /><stop offset=\"100%\" style=\"stop-color:%23764ba2;stop-opacity:1\" /></linearGradient></defs><rect width=\"320\" height=\"160\" fill=\"url(%23grad)\" /><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"14\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"middle\">教程图片</text></svg>'; // 设置备用图片
              }}
            />
          </div>
          {/* 图片底部渐变遮罩，用于文字可读性 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          {/* 分类标签容器 */}
          <div className="absolute bottom-3 left-3 z-10">
            {/* 分类标签 */}
            <span className={`px-2 py-1 ${getCategoryColor(tutorial.category)} text-white text-xs font-medium rounded-md`}>
              {tutorial.category} {/* 显示教程分类名称 */}
            </span>
          </div>
        </div>
        {/* 内容区域容器 */}
        {/* 内容区域容器 */}
        <div className="p-4 flex-grow">
          {/* 教程标题 */}
          <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{tutorial.title}</h3>
          {/* 教程元信息（发布日期和作者） */}
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-y-1 mb-2">
            {/* 发布日期信息 */}
            <span className="flex items-center mr-3">
              <i className="fas fa-calendar-alt mr-1"></i> {/* 日历图标 */}
              {tutorial.publishDate} {/* 显示发布日期 */}
            </span>
            {/* 作者信息 */}
            <span className="flex items-center">
              <i className="fas fa-user-edit mr-1"></i> {/* 作者图标 */}
              {tutorial.author} {/* 显示作者名称 */}
            </span>
          </p>
          {/* 阅读全文链接 */}
          <div className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center group-hover:translate-x-1 transition-transform duration-300">
            {tHome('readMore')}
            <i className="fas fa-arrow-right ml-1 group-hover:ml-2 transition-all duration-300"></i> {/* 右箭头图标，悬停时向右移动 */}
          </div>
        </div>
      </article>
    </a>
  );
}
