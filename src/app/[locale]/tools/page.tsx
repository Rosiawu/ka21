import { redirect } from 'next/navigation';

export default function ToolsPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}#all-tools-categories`);
}
