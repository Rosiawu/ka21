import {redirect} from 'next/navigation';

// 非本地化路径的搜索页：统一重定向到默认语言路径（保留查询参数）
export default function SearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
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
