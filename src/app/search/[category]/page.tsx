import { redirect } from 'next/navigation';

export default function SearchCategoryPage({
  params
}: {
  params: { category: string }
}) {
  redirect(`/zh/search/${params.category}`);
}
