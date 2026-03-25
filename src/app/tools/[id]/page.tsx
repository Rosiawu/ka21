import {redirect} from 'next/navigation';

// 非本地化路径：统一重定向到默认中文路径下，确保 next-intl 上下文可用
type ToolRedirectPageParams = Promise<{ id: string }>;

export default async function Page({ params }: { params: ToolRedirectPageParams }) {
  const { id } = await params;
  redirect(`/zh/tools/${id}`);
}
