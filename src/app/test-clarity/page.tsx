import {redirect} from 'next/navigation';

// 非本地化路径：重定向到默认语言路径
export default function TestClarityPage() {
  redirect('/zh/test-clarity');
}
