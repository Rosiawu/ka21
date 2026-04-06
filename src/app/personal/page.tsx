import { redirect } from 'next/navigation';

export default function PersonalFallback() {
  redirect('/personal-site/index.html?locale=zh');
}
