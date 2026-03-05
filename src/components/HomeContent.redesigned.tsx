```tsx
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ToolList from '@/components/ToolList';
import toolsData from '@/data/tools.json';
import { Tool } from '@/lib/types';
import { validateTools } from '@/lib/validate';
import { useRouter } from '@/i18n/navigation';
import Link from '@/i18n/Link';
import Image from 'next/image';
import Logo from './Logo';
import { tutorials } from '@/data/tutorials';
import { TOOL_CATEGORIES } from '@/data/toolCategories';
import ToolCategorySection from './ToolCategorySection';
import { sortByDefaultOrder } from '@/utils/sortTools';
import ToolSortControls from './ToolSortControls';
import { applySorting } from '@/utils/sortTools';
import { getVisibleTools } from '@/utils/sortTools';
import StatsDisplay from './StatsDisplay';
import { HotSection } from '@/components/hot';
import SearchIntentPanel from './SearchIntentPanel';
import DevLogPreviewSection from './DevLogPreviewSection';
import { trackUserAction, trackPageView, setTag } from '@/utils/clarity';
import useDebounce from '@/hooks/useDebounce';
import useHotkey from '@/hooks/useHotkey';
import { localizeTutorialCategory } from '@/utils/tutorials';
import { getCategoryColor } from '@/utils/tutorials';
import {
  getToolHiddenTaxonomyTags,
  getToolSearchAliasTokens,
  getTutorialHiddenTaxonomyTags,
  getTutorialSearchAliasTokens,
  matchesTaxonomyToken,
  serializeTagsForTelemetry,
} from '@/lib/coreTaxonomy';

export default function HomeContent({ subtitle }: { subtitle?: string }) {
  const isEn = useLocale() === 'en';
  const tHome = useTranslations('Home');
  const tCommon = useTranslations('Common');
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const shouldRestore = sessionStorage.getItem('restore_home_scroll');
      if (shouldRestore === '1') {
        const saved = parseInt(sessionStorage.getItem('home_scroll') || '0', 10);
        if (!Number.isNaN(saved) && saved > 0) {
          window.scrollTo(0, saved);
        }
        sessionStorage.removeItem('restore_home_scroll');
      }
    }
  }, []);

  const tHot = useTranslations('Hot');
  const composerText = {
    label: isEn ? 'Conversation input' : '对话输入框',
    placeholder: isEn
      ? 'What do you want to do today? Tell me naturally and I will find tools and tutorials for you.'
      : '今天想做什么？像聊天一样告诉我，我来帮你找工具和教程。',
    mode: isEn ? 'Chat mode' : '对话模式',
    intent: isEn ? 'Intent matching enabled' : '意图匹配已开启',
    understanding: isEn ? 'Understanding your request' : '正在理解你的需求',
    clear: isEn ? 'Clear input' : '清空输入',
    send: isEn ? 'Send' : '发送',
    examples: isEn
      ? 'Try: storyboard for a short drama | write a launch post | tools that auto-summarize spreadsheets'
      : '试试这样问: 做短剧分镜 | 写一段发布文案 | 找能自动汇总表格的工具',
    tutorialImage: isEn ? 'Tutorial cover' : '教程图片',
  };
  const spotlightPodcast = {
    tag: isEn ? 'Featured Podcast' : '播客推荐',
    title: isEn ? 'Lamp Under The Light' : '灯下白',
    subtitle: isEn
      ? 'Xiaoyuzhou Podcast: real conversations from the AI community'
      : '小宇宙播客：走进 AI 圈的真实对话',
    description: isEn
      ? 'Direct access to the Lamp Under The Light episode page.'
      : '首页直达《灯下白》节目页，一键点击即可收听最新内容。',
    cta: isEn ? 'Listen on Xiaoyuzhou' : '去小宇宙收听',
    note: isEn ? 'Open episode page' : '点击打开节目页',
    logoAlt: isEn ? 'Lamp Under The Light podcast logo' : '灯下白播客 Logo',
  };
  const podcastEpisodeUrl = 'https://www.xiaoyuzhoufm.com/episodes/69a69588de29766da93ec01b';

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
 