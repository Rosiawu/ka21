"use client";

import Link from '@/i18n/Link';

export default function DevLogSubmitPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const text = {
    badge: isEn ? 'Mobile Devlog' : '手机开发日志',
    title: isEn ? 'Mobile posting now lives in the miniapp' : '手机投稿现在统一走小程序原生页',
    subtitle: isEn
      ? 'To keep mobile posting stable, H5 submit is no longer the official path. Please open the miniapp and post there.'
      : '为了把手机投稿链路收稳，H5 提交页不再作为正式入口。请直接去小程序原生页发。',
    nativeNoticeTitle: isEn ? 'Official mobile path' : '正式手机入口',
    nativeNoticeBody: isEn
      ? 'Open the KA21 miniapp home, tap the devlog wand card, then submit text and screenshots there.'
      : '打开 KA21 小程序首页，点击“开发日志魔法棒”卡片，再在原生页里提交文字和截图。',
    whyTitle: isEn ? 'Why this page was cleaned up' : '为什么这里要清理',
    whyBody: isEn
      ? 'Mobile H5 uploads inside WeChat can fail before the request even reaches the API, so keeping this form here would keep sending people into an unstable path.'
      : '微信里的手机 H5 上传会在请求到达接口前就失败，继续把表单留在这里只会把人带进不稳定链路。',
    stepTitle: isEn ? 'Use this instead' : '现在这样发',
    stepOne: isEn ? 'Open the KA21 miniapp.' : '打开 KA21 小程序。',
    stepTwo: isEn ? 'Tap the devlog wand entry on the home page.' : '点首页里的“开发日志魔法棒”。',
    stepThree: isEn ? 'Submit text and images in the native page.' : '在原生提交页里发文字和图片。',
    keepReading: isEn ? 'Keep reading the devlog' : '继续看开发日志',
    back: isEn ? 'Back to devlog' : '返回开发日志',
  };

  return (
    <div className="page-shell py-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.24),_transparent_34%),linear-gradient(135deg,_rgba(255,251,235,0.98),_rgba(255,255,255,0.96))] p-5 shadow-[0_16px_45px_rgba(245,158,11,0.10)] dark:border-amber-700/40 dark:bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(28,25,23,0.96))] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-700/60 dark:bg-slate-900/60 dark:text-amber-300">
            <i className="fas fa-wand-magic-sparkles text-[11px]" aria-hidden="true"></i>
            {text.badge}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">{text.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{text.subtitle}</p>
          <div className="mt-5">
            <Link
              href="/devlog"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
              {text.back}
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/85 sm:p-6">
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-semibold">{text.nativeNoticeTitle}</p>
            <p className="mt-1 leading-6 opacity-90">{text.nativeNoticeBody}</p>
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{text.whyTitle}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text.whyBody}</p>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-dashed border-amber-300 bg-amber-50/60 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{text.stepTitle}</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>1. {text.stepOne}</li>
              <li>2. {text.stepTwo}</li>
              <li>3. {text.stepThree}</li>
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/devlog"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            >
              <i className="fas fa-book-open text-xs" aria-hidden="true"></i>
              {text.keepReading}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <i className="fas fa-house text-xs" aria-hidden="true"></i>
              {isEn ? 'Back to home' : '回到首页'}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
