import { Metadata, ResolvingMetadata } from 'next';
import toolsData from '@/data/tools.json';
import { notFound } from 'next/navigation';
import ToolDetail from '@/app/tools/[id]/ToolDetail';
import { validateTool } from '@/lib/validate';
import { Tool } from '@/lib/types';
import { withBaseMeta } from '@/lib/withBaseMeta';
import StructuredData from '@/components/StructuredData';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { localizeTool } from '@/lib/toolLocale';

type ToolDetailPageParams = Promise<{ id: string; locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: ToolDetailPageParams
}, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale, id } = await params;
  const isEn = locale === 'en';
  const tool = toolsData.tools.find(t => t.id === id);

  if (!tool) {
    return withBaseMeta({
      title: isEn ? 'Tool Not Found - KA21 Tools' : '工具不存在 - KA21工具导航',
    }, parent);
  }

  const typedTool = tool as Tool;
  const localizedTool = localizeTool(typedTool, isEn ? 'en' : 'zh');
  const iconUrl = typedTool.icons?.svg || typedTool.icons?.png || typedTool.icon || '';

  // 生成hreflang标签（工具详情页路径）
  const hreflangConfig = generateHreflangMetadata(locale, `tools/${id}`);

  return withBaseMeta({
    title: `${localizedTool.name} - ${isEn ? 'KA21 Tools' : 'KA21工具导航'}`,
    description: localizedTool.description,
    alternates: {
      canonical: hreflangConfig.canonical,
      languages: hreflangConfig.languages
    },
    openGraph: {
      title: `${localizedTool.name} - ${isEn ? 'KA21 Tools' : 'KA21工具导航'}`,
      description: localizedTool.description,
      type: 'website',
      images: iconUrl ? [iconUrl] : [],
    },
  }, parent);
}

export default async function Page({
  params,
}: {
  params: ToolDetailPageParams
}) {
  const { id, locale } = await params;
  const foundTool = toolsData.tools.find(t => t.id === id);
  if (!foundTool || !validateTool(foundTool) || foundTool.isVisible === false) {
    notFound();
  }
  const tool: Tool = foundTool as Tool;
  const localizedTool = localizeTool(tool, locale === 'en' ? 'en' : 'zh');

  return (
    <>
      <StructuredData tool={localizedTool} type="Tool" locale={locale} />
      <ToolDetail tool={localizedTool} />
    </>
  );
}
