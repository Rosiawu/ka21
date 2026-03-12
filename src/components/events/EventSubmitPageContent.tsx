"use client";

import Link from '@/i18n/Link';
import { useState } from 'react';

type PreviewDraft = {
  title: string;
  summary: string;
  sourceUrl: string;
  organizer: string;
  author: string;
  eventDate: string;
  deadline: string;
  location: string;
  sourceLabel: string;
  tags: string[];
  coverImage: string;
};

const EMPTY_DRAFT: PreviewDraft = {
  title: '',
  summary: '',
  sourceUrl: '',
  organizer: '',
  author: '',
  eventDate: '',
  deadline: '',
  location: '',
  sourceLabel: '',
  tags: [],
  coverImage: '',
};

export default function EventSubmitPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const [sourceUrl, setSourceUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [preview, setPreview] = useState<PreviewDraft | null>(null);

  const canPreview = sourceUrl.trim().length > 0;
  const canSubmit = Boolean(preview?.title && preview?.summary && preview?.sourceUrl);

  const text = {
    badge: isEn ? 'Event Wand' : '赛事魔法棒',
    title: isEn ? 'Paste one link, preview, then publish' : '只贴一个链接，先预览再发帖',
    subtitle: isEn
      ? 'We parse the post first, show you the result, then publish after your confirmation.'
      : '系统会先解析原帖，给你看一版预览，确认没问题后再正式发到赛事区。',
    back: isEn ? 'Back to event board' : '返回赛事区',
    sourceUrlLabel: isEn ? 'Original post link' : '原帖链接',
    sourceUrlPlaceholder: isEn
      ? 'Paste a public WeChat post or event page link'
      : '把公众号文章或公开赛事页面链接贴进来',
    tipsTitle: isEn ? 'Parsing upgrade' : '这次升级了什么',
    tipsBody: isEn
      ? 'We now preview parsed fields first, and try OCR on the poster cover when the article itself has too little text.'
      : '现在会先给你看解析预览；如果正文信息太少，还会尝试从海报封面里补抓主办方、截止时间和地点。',
    preview: isEn ? 'Parse preview' : '先解析预览',
    previewing: isEn ? 'Parsing...' : '解析中...',
    publish: isEn ? 'Confirm and publish' : '确认无误，发到赛事区',
    publishing: isEn ? 'Publishing...' : '发布中...',
    success: isEn
      ? 'Submitted. Wait for auto deploy, then open the event board.'
      : '提交成功。等自动部署完成后，去赛事区就能看到。',
    openEvent: isEn ? 'Open the new event post' : '打开新赛事帖',
    previewTitle: isEn ? 'Preview before publish' : '发布前预览',
    previewHint: isEn
      ? 'You can adjust the parsed fields below before sending them to GitHub.'
      : '下面这版是解析结果，你可以微调字段，再确认发布到 GitHub。',
    noCover: isEn ? 'No cover found' : '没抓到封面图',
    tags: isEn ? 'Tags' : '标签',
    titleField: isEn ? 'Title' : '标题',
    summaryField: isEn ? 'Summary' : '摘要',
    organizerField: isEn ? 'Organizer' : '主办方',
    eventDateField: isEn ? 'Event date' : '赛事时间',
    deadlineField: isEn ? 'Deadline' : '截止时间',
    locationField: isEn ? 'Location / format' : '地点 / 形式',
    sourceField: isEn ? 'Source label' : '来源标签',
    reset: isEn ? 'Change link' : '换个链接',
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
    if (raw === 'extract-title-failed') return isEn ? 'Could not parse the title.' : '没能解析出标题。';
    return raw || (isEn ? 'Submit failed.' : '提交失败。');
  };

  const updateField = (key: keyof PreviewDraft, value: string) => {
    setPreview((current) => {
      if (!current) return current;
      if (key === 'tags') {
        return { ...current, tags: value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) };
      }
      return { ...current, [key]: value };
    });
  };

  const handlePreview = async () => {
    if (!canPreview) return;
    setPreviewing(true);
    setMessage('');
    setSuccessUrl('');

    try {
      const response = await fetch('/api/events/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl }),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(humanizeMessage(result.message));
        setPreview(null);
        return;
      }

      setPreview({
        ...EMPTY_DRAFT,
        ...result.data,
        sourceUrl,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isEn ? 'Preview failed.' : '预览失败。'));
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview || !canSubmit) return;
    setSubmitting(true);
    setMessage('');
    setSuccessUrl('');

    try {
      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(humanizeMessage(result.message));
        return;
      }

      setMessage(text.success);
      setSuccessUrl(`/${locale}/events#${result.data.id}`);
      setSourceUrl('');
      setPreview(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isEn ? 'Submit failed.' : '提交失败。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
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
              onClick={handlePreview}
              disabled={!canPreview || previewing}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(20,184,166,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
              {previewing ? text.previewing : text.preview}
            </button>

            {preview && (
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{text.previewTitle}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text.previewHint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setMessage('');
                      setSuccessUrl('');
                    }}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {text.reset}
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleField}</span>
                      <input
                        value={preview.title}
                        onChange={(event) => updateField('title', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.summaryField}</span>
                      <textarea
                        value={preview.summary}
                        onChange={(event) => updateField('summary', event.target.value)}
                        className="min-h-[140px] w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.organizerField}</span>
                        <input
                          value={preview.organizer}
                          onChange={(event) => updateField('organizer', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.locationField}</span>
                        <input
                          value={preview.location}
                          onChange={(event) => updateField('location', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.eventDateField}</span>
                        <input
                          value={preview.eventDate}
                          onChange={(event) => updateField('eventDate', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.deadlineField}</span>
                        <input
                          value={preview.deadline}
                          onChange={(event) => updateField('deadline', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.sourceField}</span>
                        <input
                          value={preview.sourceLabel}
                          onChange={(event) => updateField('sourceLabel', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.tags}</span>
                        <input
                          value={preview.tags.join('，')}
                          onChange={(event) => updateField('tags', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                      {preview.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview.coverImage} alt={preview.title} className="aspect-[4/5] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                          {text.noCover}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                    >
                      <i className="fas fa-paper-plane text-xs" aria-hidden="true"></i>
                      {submitting ? text.publishing : text.publish}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
