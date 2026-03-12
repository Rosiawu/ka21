"use client";

/* eslint-disable @next/next/no-img-element */

import Link from '@/i18n/Link';
import { useState } from 'react';

type UploadImageItem = {
  file: File;
  previewUrl: string;
};

function readFilesForPreview(files: FileList) {
  return Promise.all(
    Array.from(files)
      .slice(0, 9)
      .map(
        (file) =>
          new Promise<UploadImageItem>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                file,
                previewUrl: typeof reader.result === 'string' ? reader.result : '',
              });
            reader.onerror = () => reject(new Error('read-file-failed'));
            reader.readAsDataURL(file);
          })
      )
  );
}

export default function DevLogSubmitPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const text = {
    badge: isEn ? 'Mobile Devlog' : '手机开发日志',
    title: isEn ? 'Post an update like a social feed' : '像发朋友圈一样发开发日志',
    subtitle: isEn
      ? 'Write a title, add a few screenshots, hit submit, and let GitHub + deployment finish the rest.'
      : '写个标题，配几张截图，点一下提交，剩下的交给 GitHub 和自动部署。',
    back: isEn ? 'Back to devlog' : '返回开发日志',
    titleLabel: isEn ? 'Title' : '标题',
    titlePlaceholder: isEn ? 'What changed today?' : '今天改了什么？一句话先说清楚',
    authorLabel: isEn ? 'Author (optional)' : '署名（可选）',
    authorPlaceholder: isEn ? 'Your name or nickname' : '你的名字或昵称',
    bodyLabel: isEn ? 'Text' : '正文',
    bodyPlaceholder: isEn
      ? 'Write it in your natural voice. What changed, what was annoying, what finally worked?'
      : '直接按你平时说话的方式写：改了什么、卡在哪、最后怎么搞定的。',
    upload: isEn ? 'Add screenshots' : '上传截图',
    hint: isEn ? 'Up to 9 images. Mobile-first, no extra formatting required.' : '最多 9 张图。按手机直觉发就行，不需要额外排版。',
    submit: isEn ? 'Submit and push' : '提交并推到 GitHub',
    submitting: isEn ? 'Submitting...' : '提交中...',
    success: isEn ? 'Submitted. Wait for auto deploy, then open the devlog page.' : '提交成功。等自动部署完成后，去开发日志页就能看到。',
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    try {
      const nextImages = await readFilesForPreview(event.target.files);
      setImages(nextImages.filter((item) => item.previewUrl));
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
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('body', body);
      images.forEach((item) => {
        formData.append('images', item.file);
      });

      const response = await fetch('/api/devlog/submit', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(result.message || (isEn ? 'Submit failed.' : '提交失败。'));
        return;
      }
      setMessage(text.success);
      setSuccessUrl(`/${locale}/devlog#${result.data.id}`);
      setTitle('');
      setAuthor('');
      setBody('');
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
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleLabel}</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={text.titlePlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.authorLabel}</span>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder={text.authorPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.bodyLabel}</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={text.bodyPlaceholder}
                className="min-h-[260px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="rounded-[1.5rem] border border-dashed border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{text.upload}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{text.hint}</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">
                  <i className="fas fa-image text-xs" aria-hidden="true"></i>
                  {text.upload}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((image, index) => (
                    <img key={index} src={image.previewUrl} alt={`devlog-upload-${index + 1}`} className="aspect-square rounded-2xl object-cover shadow-sm" />
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
              {submitting ? text.submitting : text.submit}
            </button>

            {message && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p>{message}</p>
                {successUrl && (
                  <Link href={successUrl} className="mt-2 inline-flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                    <span>{isEn ? 'Open the new log' : '打开新日志'}</span>
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
