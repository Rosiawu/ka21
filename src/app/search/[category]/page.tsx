import { redirect } from 'next/navigation';

type SearchCategoryPageParams = Promise<{ category: string }>;

export default async function SearchCategoryPage({
  params
}: {
  params: SearchCategoryPageParams
}) {
  const { category } = await params;
  redirect(`/zh/search/${category}`);
}
