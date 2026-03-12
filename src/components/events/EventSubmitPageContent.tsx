"use client";

import Link from '@/i18n/Link';
import { useState } from 'react';

export default function EventSubmitPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const [sourceUrl, setSourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const canSubmit = sourceUrl.trim().length > 0;

  const text = {
    badge: isEn ? 'Event Wand' : '赛事魔法棒',
    title: isEn ? 'Paste one link, publish one event post' : '只贴一个链接，自动生成赛事帖',
    subtitle: isEn
      ? 'Users only need to paste the original link. We parse the article, fill the event fields, and submit it to GitHub automatically.'
      : '用户只需要粘贴原帖链接。系统会自动解析文章、补齐赛事字段，并直接提交到 GitHub。',
    back: isEn ? 'Back to event board' : '返回赛事区',
    sourceUrlLabel: isEn ? 'Original post link' : '原帖链接',
    sourceUrlPlaceholder: isEn
      ? 'Paste a public WeChat post or event page link'
      : '把公众号文章或公开赛事页面链接贴进来',
    tipsTitle: isEn ? 'What gets auto-filled' : '会自动补哪些字段',
    tipsBody: isEn
      ? 'Title, summary, organizer, date, deadline, location, tags, cover, and source label.'
      : '标题、摘要、主办方、时间、截止、地点、标签、封面图、来源标签都会尽量自动补齐。',
    submit: isEn ? 'Parse and publish' : '解析并发到赛事区',
    submitting: isEn ? 'Parsing and publishing...' : '解析并提交中...',
    success: isEn
      ? 'Submitted. Wait for auto deploy, then open the event board.'
      : '提交成功。等自动部署完成后，去赛事区就能看到。',
    openEvent: isEn ? 'Open the new event post' : '打开新赛事帖',
    errorWechat: isEn
      ? 'WeChat blocked this article with a verification page. Try opening the source once in a normal browser or use another public link.'
      : '这条公众号链接当前被微信验证页拦住了，先用普通浏览器打开一次原文，或者换一个公开可访问链接再试。',
    errorDuplicate: isEn ? 'This link already exists in the event board.' : '这条链接已经在赛事区里了。',
  };

  const humanizeMessage = (raw: string) => {
    if (raw === 'wechat-verification-required') return text.errorWechat;
    if (raw === 'duplicate-source-url') return text.errorDuplicate;
    if (raw === 'invalid-source-url') return isEn ? 'Invalid URL.' : '链接格式不对。';
    if (raw === 'missing-source-url') return isEn ? 'Please paste a link first.' : '先贴一个链接。';
    return raw || (isEn ? 'Submit failed.' : '提交失败。');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage('');
    setSuccessUrl('');

    try {
      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl }),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(humanizeMessage(result.message));
        return;
      }

      setMessage(text.success);
      setSuccessUrl(`/${locale}/events#${result.data.id}`);
      setSourceUrl('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isEn ? 'Submit failed.' : '提交失败。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell py-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_34%),linear-gradient(135deg,_rgba(236,253,245,0.98),_rgba(255,255,255,0.96))] p-5 shadow-[0_16px_45px_rgba(16,185,129,0.10)] dark:border-emerald-700/40 dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_30%),linear-gradient(135deg,_rgba(6,78,59,0.32),_rgba(15,23,42,0.96))] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-slate-900/60 dark:text-emerald-300">
            <i className="fas fa-wand-magic-sparkles text-[11px]" aria-hidden="true"></i>
            {text.badge}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">{text.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{text.subtitle}</p>
          <div className="mt-5">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
              {text.back}
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/85 sm:p-6">
          <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm text-slate-700 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{text.tipsTitle}</p>
            <p className="mt-1 leading-6">{text.tipsBody}</p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.sourceUrlLabel}</span>
              <textarea
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder={text.sourceUrlPlaceholder}
                className="min-h-[150px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(20,184,166,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
              {submitting ? text.submitting : text.submit}
            </button>

            {message && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p>{message}</p>
                {successUrl && (
                  <Link href={successUrl} className="mt-2 inline-flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                    <span>{text.openEvent}</span>
                    <i className="fas fa-arrow-right text-xs" aria-hidden="true"></i>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
