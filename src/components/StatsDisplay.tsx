/**
 * StatsDisplay组件
 * 
 * 功能描述：
 * 在网站首页显示工具和教程的统计数据，为用户提供平台规模的直观感受
 * 
 * 实现特点：
 * 1. 动态计算并显示可见工具数量（通过isVisible字段过滤）
 * 2. 显示教程总数
 * 3. 包含"精品原则"的说明文本，强调网站定位
 * 4. 响应式设计，适应不同屏幕尺寸
 * 
 * 注意：组件每次渲染时会重新计算统计数据，确保数据实时准确
 */
import { getVisibleTools } from '@/utils/sortTools';
import toolsData from '@/data/tools.json';
import { tutorials } from '@/data/tutorials';
import { Tool } from '@/lib/types';
import {useTranslations} from 'next-intl';

export default function StatsDisplay() {
  const tStats = useTranslations('Stats');
  // 获取可见工具数量并确保类型正确
  const allTools = toolsData.tools as Tool[];
  const visibleTools = getVisibleTools(allTools);
  // 计算四次元小工具数量与核心AI工具数量
  const utilsCount = visibleTools.filter(tool => tool.toolCategory === 'utils').length;
  const coreToolCount = visibleTools.length - utilsCount;
  
  // 获取教程数量
  const tutorialCount = tutorials.length;
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-3 px-4 bg-gray-50 dark:bg-gray-900/50 dark:backdrop-blur-sm dark:border dark:border-gray-700/50 rounded-lg my-4 text-center shadow-sm dark:shadow-gray-900/20">
      {/* 核心AI工具数量统计 */}
      <div className="flex items-center">
        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{coreToolCount}</span>
        <span className="ml-2 text-gray-600 dark:text-gray-300">{tStats('coreToolsLabel')}</span>
      </div>

      {/* 分隔线 - 仅在sm尺寸及以上显示 */}
      <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-600/60"></div>
      
      {/* 四次元小工具数量统计 */}
      <div className="flex items-center">
        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{utilsCount}</span>
        <span className="ml-2 text-gray-600 dark:text-gray-300">{tStats('utilsLabel')}</span>
      </div>
      
      {/* 分隔线 - 仅在sm尺寸及以上显示 */}
      <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-600/60"></div>
      
      {/* 教程数量统计 */}
      <div className="flex items-center">
        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{tutorialCount}</span>
        <span className="ml-2 text-gray-600 dark:text-gray-300">{tStats('tutorialsLabel')}</span>
      </div>
      
      {/* 分隔线 - 仅在sm尺寸及以上显示 */}
      <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-600/60"></div>
      
      {/* 精品策略说明文本 */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {tStats('strategyNote')}
      </div>
    </div>
  );
}
