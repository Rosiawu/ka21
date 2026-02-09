import { Metadata, ResolvingMetadata } from 'next';
import toolsData from '@/data/tools.json';
import { notFound } from 'next/navigation';
import ToolDetail from '@/app/tools/[id]/ToolDetail';
import { validateTool } from '@/lib/validate';
import { Tool } from '@/lib/types';
import { withBaseMeta } from '@/lib/withBaseMeta';
import StructuredData from '@/components/StructuredData';
import { generateHreflangMetadata } from '@/lib/hreflang';

export async function generateMetadata({
  params,
}: {
  params: { id: string, locale: string }
}, parent: ResolvingMetadata): Promise<Metadata> {
  const tool = toolsData.tools.find(t => t.id === params.id);

  if (!tool) {
    return withBaseMeta({
      title: '工具不存在 - KA21工具导航',
    }, parent);
  }

  const typedTool = tool as Tool;
  const iconUrl = typedTool.icons?.svg || typedTool.icons?.png || typedTool.icon || '';

  // 生成hreflang标签（工具详情页路径）
  const hreflangConfig = generateHreflangMetadata(params.locale, `tools/${params.id}`);

  return withBaseMeta({
    title: `${tool.name} - KA21工具导航`,
    description: tool.description,
    alternates: {
      canonical: hreflangConfig.canonical,
      languages: hreflangConfig.languages
    },
    openGraph: {
      title: `${tool.name} - KA21工具导航`,
      description: tool.description,
      type: 'website',
      images: iconUrl ? [iconUrl] : [],
    },
  }, parent);
}

export default function Page({
  params,
}: {
  params: { id: string }
}) {
  const foundTool = toolsData.tools.find(t => t.id === params.id);
  if (!foundTool || !validateTool(foundTool) || foundTool.isVisible === false) {
    notFound();
  }
  const tool: Tool = foundTool as Tool;

  return (
    <>
      <StructuredData tool={tool} type="Tool" />
      <ToolDetail tool={tool} />
    </>
  );
}

