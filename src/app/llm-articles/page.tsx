import {redirect} from 'next/navigation';

// 非本地化路径：重定向到默认语言
export default function LLMArticlesRoot() {
  redirect('/zh/llm-articles');
}
