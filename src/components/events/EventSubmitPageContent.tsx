"use client";

/* eslint-disable @next/next/no-img-element */

import Link from '@/i18n/Link';
import { useState } from 'react';

function readFilesAsDataUrls(files: FileList) {
  return Promise.all(
    Array.from(files)
      .slice(0, 6)
      .map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(new Error('read-file-failed'));
            reader.readAsDataURL(file);
          })
      )
  );
}

export default function EventSubmitPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [author, setAuthor] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const canSubmit = title.trim().length > 0 && summary.trim().length > 0 && sourceUrl.trim().length > 0;

  const text = {
    badge: isEn ? 'Mobile Event Wand' : '赛事魔法棒',
    title: isEn ? 'Post an event thread from your phone' : '用手机把外面看到的赛事帖捞回来',
    subtitle: isEn
      ? 'Paste the original post link, write a short summary, add a poster screenshot if needed, and publish it to the event board.'
      : '把外部原帖链接贴进来，顺手写一句摘要，必要时传张海报截图，就能发到赛事区。',
    back: isEn ? 'Back to event board' : '返回赛事区',
    titleLabel: isEn ? 'Event title' : '赛事标题',
    titlePlaceholder: isEn ? 'What is this event called?' : '赛事名、招募名、挑战赛名',
    summaryLabel: isEn ? 'What should people know?' : '一句话说清楚这帖值不值得看',
    summaryPlaceholder: isEn
      ? 'Summarize the key info: who can join, why it matters, what makes it worth opening.'
      : '把关键信息捋顺：适合谁、奖励是什么、值得点开的原因是什么。',
    sourceUrlLabel: isEn ? 'Original post link' : '原帖链接',
    sourceUrlPlaceholder: isEn ? 'Paste the public link here' : '把你在外面看到的公开链接贴这里',
    organizerLabel: isEn ? 'Organizer (optional)' : '主办方（可选）',
    organizerPlaceholder: isEn ? 'Brand, studio, platform...' : '品牌、机构、平台名都可以',
    authorLabel: isEn ? 'Your nickname (optional)' : '投稿人昵称（可选）',
    authorPlaceholder: isEn ? 'Who spotted this?' : '谁顺手捞的这条帖子',
    eventDateLabel: isEn ? 'Event date (optional)' : '赛事时间（可选）',
    deadlineLabel: isEn ? 'Deadline (optional)' : '截止时间（可选）',
    locationLabel: isEn ? 'Location / format (optional)' : '地点 / 形式（可选）',
    locationPlaceholder: isEn ? 'Online, Shanghai, hybrid...' : '线上、上海、线下、混合都可以',
    sourceLabelLabel: isEn ? 'Source label (optional)' : '来源标签（可选）',
    sourceLabelPlaceholder: isEn ? 'Example: WeChat, Xiaohongshu, official website' : '例如：公众号、小红书、官网',
    tagsLabel: isEn ? 'Tags (comma-separated)' : '标签（用逗号分隔）',
    tagsPlaceholder: isEn ? 'AI video, design, hackathon' : 'AI视频，设计，比赛，黑客松',
    upload: isEn ? 'Add poster screenshots' : '上传海报截图',
    uploadHint: isEn ? 'Up to 6 images. The first one becomes the cover.' : '最多 6 张图，第一张会自动做封面。',
    submit: isEn ? 'Publish to event board' : '发到赛事区',
    submitting: isEn ? 'Publishing...' : '发布中...',
    success: isEn ? 'Submitted. Wait for auto deploy, then open the event board.' : '提交成功。等自动部署完成后，去赛事区就能看到。',
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    try {
      const nextImages = await readFilesAsDataUrls(event.target.files);
      setImages(nextImages.filter(Boolean));
      setMessage('');
    } catch {
      setMessage(isEn ? 'Image read failed.' : '图片读取失败。');
    }
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
        body: JSON.stringify({
          title,
          summary,
          sourceUrl,
          organizer,
          author,
          eventDate,
          deadline,
          location,
          sourceLabel,
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          images,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(result.message || (isEn ? 'Submit failed.' : '提交失败。'));
        return;
      }
      setMessage(text.success);
      setSuccessUrl(`/${locale}/events#${result.data.id}`);
      setTitle('');
      setSummary('');
      setSourceUrl('');
      setOrganizer('');
      setAuthor('');
      setEventDate('');
      setDeadline('');
      setLocation('');
      setSourceLabel('');
      setTags('');
      setImages([]);
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
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleLabel}</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={text.titlePlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.summaryLabel}</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder={text.summaryPlaceholder}
                className="min-h-[180px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.sourceUrlLabel}</span>
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder={text.sourceUrlPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.organizerLabel}</span>
                <input
                  value={organizer}
                  onChange={(event) => setOrganizer(event.target.value)}
                  placeholder={text.organizerPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.authorLabel}</span>
                <input
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder={text.authorPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.eventDateLabel}</span>
                <input
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  placeholder="2026-04-18"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.deadlineLabel}</span>
                <input
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  placeholder="2026-04-10"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.locationLabel}</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={text.locationPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.sourceLabelLabel}</span>
                <input
                  value={sourceLabel}
                  onChange={(event) => setSourceLabel(event.target.value)}
                  placeholder={text.sourceLabelPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.tagsLabel}</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={text.tagsPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="rounded-[1.5rem] border border-dashed border-emerald-300 bg-emerald-50/70 p-4 dark:border-emerald-700/60 dark:bg-emerald-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{text.upload}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{text.uploadHint}</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">
                  <i className="fas fa-image text-xs" aria-hidden="true"></i>
                  {text.upload}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((image, index) => (
                    <img key={index} src={image} alt={`event-upload-${index + 1}`} className="aspect-square rounded-2xl object-cover shadow-sm" />
                  ))}
                </div>
              )}
            </div>

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
                    <span>{isEn ? 'Open the new event post' : '打开新赛事帖'}</span>
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
