import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {resolvePreferredLocale} from '@/i18n/resolveLocale';

export default async function RootRedirect() {
  const preferredLocale = resolvePreferredLocale({
    cookieLocale: (await cookies()).get('locale')?.value,
    acceptLanguage: (await headers()).get('accept-language'),
  });

  redirect(`/${preferredLocale}`);
}
