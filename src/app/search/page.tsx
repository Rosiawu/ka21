import {redirect} from 'next/navigation';

// 非本地化路径的搜索页：统一重定向到默认语言路径（保留查询参数）
type SearchPageQuery = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({
  searchParams
}: {
  searchParams: SearchPageQuery
}) {
  const resolvedSearchParams = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams || {})) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.set(key, value);
    }
  }
  const query = qs.toString();
  redirect(`/zh/search${query ? `?${query}` : ''}`);
}
