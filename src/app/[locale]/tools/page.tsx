import { redirect } from 'next/navigation';

type ToolsPageParams = Promise<{ locale: string }>;

export default async function ToolsPage({
  params,
}: {
  params: ToolsPageParams;
}) {
  const { locale } = await params;
  redirect(`/${locale}#all-tools-categories`);
}
