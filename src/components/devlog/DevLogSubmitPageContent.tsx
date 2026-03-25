"use client";
/* eslint-disable @next/next/no-img-element */

import Link from '@/i18n/Link';
import AdminSessionGate from '@/components/admin/AdminSessionGate';
import type { ChangeEvent, ClipboardEvent } from 'react';
import { useRef, useState } from 'react';

type UploadImageItem = {
  file: File;
  previewUrl: string;
};

function readFilesForPreview(files: File[]) {
  return Promise.all(
    files.slice(0, 9).map(
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
        }),
    ),
  );
}

function fileListToArray(files: FileList | null) {
  return files ? Array.from(files).filter((file) => file.type.startsWith('image/')) : [];
}

async function buildImageItems(files: File[]) {
  const items = await readFilesForPreview(files);
  return items.filter((item) => item.previewUrl);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const text = {
    badge: isEn ? 'Web Devlog Submit' : '网页开发日志提交',
    title: isEn ? 'Paste text, paste images, and post a devlog' : '直接粘贴文字、粘贴图片，顺手发一条开发日志',
    subtitle: isEn
      ? 'Built for desktop workflow: draft in Codex, paste here, and push the update straight to GitHub.'
      : '按你现在和 Codex 协作的习惯来：文案在这里粘贴，截图直接贴进来，点一下就写进 GitHub。',
    mobileHint: isEn
      ? 'Mobile posting still uses the miniapp native page. This page is the stable desktop/web submit path.'
      : '手机投稿仍然走小程序原生页；这个页面是稳定的桌面/网页提交流程。',
    titleLabel: isEn ? 'Title' : '标题',
    titlePlaceholder: isEn ? 'What changed this time?' : '这次改了什么？一句话先说清楚',
    authorLabel: isEn ? 'Author (optional)' : '署名（可选）',
    authorPlaceholder: isEn ? 'Your name or nickname' : '你的名字或昵称',
    bodyLabel: isEn ? 'Body' : '正文',
    bodyPlaceholder: isEn
      ? 'Paste the devlog text here. Natural language is enough.'
      : '把开发日志正文直接粘贴到这里。按平时说话的方式写就行。',
    uploadLabel: isEn ? 'Images' : '配图',
    uploadHint: isEn
      ? 'Paste screenshots with Ctrl/Cmd+V, or choose files manually. Up to 9 images.'
      : '可以直接 Ctrl/Cmd+V 粘贴截图，也可以手动选图，最多 9 张。',
    pasteHint: isEn
      ? 'Tip: click the text area first, then paste images from your clipboard.'
      : '提示：先点一下正文输入框，再粘贴剪贴板里的截图也可以。',
    chooseImages: isEn ? 'Choose images' : '选择图片',
    clearImages: isEn ? 'Clear images' : '清空图片',
    submit: isEn ? 'Submit to GitHub' : '提交到 GitHub',
    submitting: isEn ? 'Submitting...' : '提交中...',
    back: isEn ? 'Back to devlog' : '返回开发日志',
    success: isEn ? 'Submitted. Wait for deployment, then open the devlog page.' : '已经提交。等部署完成后，开发日志页就会更新。',
    open: isEn ? 'Open the new log' : '打开新日志',
    pasteReady: isEn ? 'Clipboard image added.' : '剪贴板图片已加入。',
    pasteEmpty: isEn ? 'No image found in clipboard.' : '剪贴板里没有可用图片。',
  };

  const appendImages = async (files: File[]) => {
    if (!files.length) {
      setMessage(text.pasteEmpty);
      return;
    }
    const remaining = Math.max(0, 9 - images.length);
    if (remaining <= 0) {
      setMessage(isEn ? 'Image limit reached (9).' : '图片已到上限（9 张）。');
      return;
    }

    try {
      const nextItems = await buildImageItems(files.slice(0, remaining));
      setImages((current) => [...current, ...nextItems].slice(0, 9));
      setMessage(text.pasteReady);
    } catch {
      setMessage(isEn ? 'Image read failed.' : '图片读取失败。');
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await appendImages(fileListToArray(event.target.files));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (!files.length) return;
    event.preventDefault();
    await appendImages(files);
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
      images.forEach((item) => formData.append('images', item.file));

      const response = await fetch('/api/devlog/submit', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result?.success || !result?.data?.id) {
        setMessage(result?.message || (isEn ? 'Submit failed.' : '提交失败。'));
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
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden rounded-[2rem] border border-indigo-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_34%),linear-gradient(135deg,_rgba(238,242,255,0.98),_rgba(255,255,255,0.96))] p-5 shadow-[0_16px_45px_rgba(99,102,241,0.10)] dark:border-indigo-700/40 dark:bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(17,24,39,0.96))] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-700/60 dark:bg-slate-900/60 dark:text-indigo-300">
            <i className="fas fa-pen-to-square text-[11px]" aria-hidden="true"></i>
            {text.badge}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">{text.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{text.subtitle}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
            <i className="fas fa-mobile-screen-button text-xs" aria-hidden="true"></i>
            {text.mobileHint}
          </div>
          <div className="mt-5">
            <Link
              href="/devlog"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
              {text.back}
            </Link>
          </div>
        </section>

        <div className="mt-6">
          <AdminSessionGate locale={isEn ? 'en' : 'zh'}>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/85 sm:p-6">
              <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleLabel}</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={text.titlePlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.authorLabel}</span>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder={text.authorPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{text.bodyLabel}</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onPaste={handlePaste}
                placeholder={text.bodyPlaceholder}
                className="min-h-[260px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="rounded-[1.5rem] border border-dashed border-indigo-300 bg-indigo-50/70 p-4 dark:border-indigo-700/60 dark:bg-indigo-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{text.uploadLabel}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{text.uploadHint}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text.pasteHint}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300">
                    <i className="fas fa-image text-xs" aria-hidden="true"></i>
                    {text.chooseImages}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                    >
                      <i className="fas fa-trash-can text-xs" aria-hidden="true"></i>
                      {text.clearImages}
                    </button>
                  )}
                </div>
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <img key={`${image.file.name}-${index}`} src={image.previewUrl} alt={`devlog-upload-${index + 1}`} className="aspect-square rounded-2xl object-cover shadow-sm" />
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(59,130,246,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fas fa-cloud-arrow-up text-xs" aria-hidden="true"></i>
              {submitting ? text.submitting : text.submit}
            </button>

            {message && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p>{message}</p>
                {successUrl && (
                  <Link href={successUrl} className="mt-2 inline-flex items-center gap-2 font-medium text-indigo-700 dark:text-indigo-300">
                    <span>{text.open}</span>
                    <i className="fas fa-arrow-right text-xs" aria-hidden="true"></i>
                  </Link>
                )}
              </div>
            )}
              </div>
            </section>
          </AdminSessionGate>
        </div>
      </div>
    </div>
  );
}
