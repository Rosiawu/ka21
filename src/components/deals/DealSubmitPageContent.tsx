"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import ContributorBinder, { type BoundContributor } from './ContributorBinder';
import type { DealExtractionResult, DealViewModel } from '@/lib/deals/types';

function readFilesAsDataUrls(files: FileList) {
  return Promise.all(
    Array.from(files)
      .slice(0, 3)
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

export default function DealSubmitPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  type PreviewState = DealExtractionResult | DealViewModel;
  const [boundContributor, setBoundContributor] = useState<BoundContributor | null>(null);
  const [rawText, setRawText] = useState('');
  const [supplementUrl, setSupplementUrl] = useState('');
  const [rawImages, setRawImages] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const canExtract = rawText.trim().length > 0 || rawImages.length > 0 || supplementUrl.trim().length > 0;

  const moderationTone = useMemo(() => {
    if (!preview) return '';
    return preview.moderationDecision === 'approved'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300';
  }, [preview]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    try {
      const dataUrls = await readFilesAsDataUrls(event.target.files);
      setRawImages(dataUrls.filter(Boolean));
    } catch {
      setMessage(isEn ? 'Image read failed.' : '图片读取失败。');
    }
  };

  const handleExtract = async () => {
    if (!canExtract) return;
    setLoadingPreview(true);
    setMessage('');
    try {
      const response = await fetch('/api/deals/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, rawImages, supplementUrl }),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(result.message || (isEn ? 'Preview failed.' : '预审失败。'));
        return;
      }
      setPreview(result.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEn ? 'Preview failed.' : '预审失败。');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async () => {
    if (!boundContributor?.id) {
      setMessage(isEn ? 'Bind contributor identity first.' : '请先绑定投稿身份。');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/deals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributorId: boundContributor.id, rawText, rawImages, supplementUrl }),
      });
      const result = await response.json();
      if (!result.success) {
        if (result.message === 'daily-submit-limit-exceeded') {
          setMessage(isEn ? 'Daily limit reached: 10 submissions.' : '今日投稿上限已到：10 条。');
          return;
        }
        setMessage(result.message || (isEn ? 'Submit failed.' : '提交失败。'));
        return;
      }
      setMessage(isEn ? 'Submitted. Scroll down to view result.' : '已提交，结果在下方。');
      setPreview(result.data);
      setRawText('');
      setSupplementUrl('');
      setRawImages([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEn ? 'Submit failed.' : '提交失败。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-orange-100 via-white to-amber-50 p-8 shadow-sm ring-1 ring-orange-100 dark:from-gray-950 dark:via-gray-950 dark:to-orange-950/30 dark:ring-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600 dark:text-orange-300">{isEn ? 'Deals MVP' : '羊毛区 MVP'}</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Submit a deal with text, image proof, and auto pre-check' : '用文字、截图和自动预审，把羊毛顺手贴进社区'}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{isEn ? 'This repo snapshot keeps web submission first. Fields are extracted from text and links, and uncertain cases are rejected by default.' : '这份仓库快照先保留网页投稿主路径。系统会从文字和链接中抽字段，不确定内容默认拒绝。'}</p>
        </section>

        <ContributorBinder locale={locale} onBound={setBoundContributor} />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Submission input' : '投稿输入'}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{isEn ? 'Paste text, add image proof, and optionally attach a source link.' : '可以直接粘贴文字、补充截图，也可以额外补一个来源链接。'}</p>
              </div>
              <a href={`/${locale}/deals`} className="text-sm font-medium text-orange-600 transition hover:text-orange-700 dark:text-orange-300">{isEn ? 'View deal feed' : '查看羊毛区'}</a>
            </div>

            <div className="mt-5 space-y-4">
              <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder={isEn ? 'Paste the deal text, promo copy, group message, or your own summary.' : '贴上羊毛文字、活动文案、群消息，或者你自己的整理说明。'} className="min-h-[220px] w-full rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <input type="url" value={supplementUrl} onChange={(event) => setSupplementUrl(event.target.value)} placeholder={isEn ? 'Supplement source URL (optional)' : '补充来源链接（可选，不填也会从正文里提取）'} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-orange-400 hover:text-orange-600 dark:border-gray-700 dark:text-gray-300">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  {isEn ? 'Upload proof images' : '上传截图证据'}
                </label>
              </div>

              {rawImages.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{rawImages.map((image, index) => <img key={index} src={image} alt={`proof-${index + 1}`} className="aspect-square rounded-2xl object-cover shadow-sm" />)}</div>}

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleExtract} disabled={!canExtract || loadingPreview} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{loadingPreview ? (isEn ? 'Checking...' : '预审中...') : (isEn ? 'Run pre-check' : '先跑预审')}</button>
                <button type="button" onClick={handleSubmit} disabled={!canExtract || submitting} className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900">{submitting ? (isEn ? 'Submitting...' : '提交中...') : (isEn ? 'Submit now' : '确认提交')}</button>
              </div>

              {message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/80">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Pre-check logic' : '预审逻辑'}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
              <li>{isEn ? '1. Extract URL, benefit, price, invite code, and expiry hints from text.' : '1. 从文本里提取链接、福利点、价格、邀请码和失效时间线索。'}</li>
              <li>{isEn ? '2. Score confidence based on source completeness and actionable detail.' : '2. 根据信息完整度和可执行程度计算置信度。'}</li>
              <li>{isEn ? '3. Hit risk tags when content is too short, code-only, no source, or uses suspicious words.' : '3. 如果内容太短、只有邀请码、没有来源或命中高风险词，就打风险标签。'}</li>
              <li>{isEn ? '4. Any uncertain case is rejected by default in this MVP.' : '4. 这版 MVP 对不确定内容统一按拒绝处理。'}</li>
            </ul>
          </div>
        </section>

        {preview && (
          <section className={`rounded-3xl border p-5 shadow-sm ${moderationTone}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]">{isEn ? 'Preview result' : '预审结果'}</p>
                <h2 className="mt-2 text-2xl font-semibold">{preview.title || (isEn ? 'Untitled deal' : '未命名羊毛')}</h2>
                <p className="mt-2 text-sm leading-6">{preview.moderationReason}</p>
              </div>
              {'id' in preview && preview.id && <a href={`/${locale}/deals/${preview.id}`} className="text-sm font-semibold underline underline-offset-4">{isEn ? 'Open detail page' : '打开详情页'}</a>}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-950/50"><p className="text-xs uppercase tracking-[0.2em] opacity-70">{isEn ? 'Confidence' : '置信度'}</p><p className="mt-2 text-3xl font-semibold">{Math.round((preview.confidenceScore || 0) * 100)}%</p></div>
              <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-950/50"><p className="text-xs uppercase tracking-[0.2em] opacity-70">{isEn ? 'Source' : '来源'}</p><p className="mt-2 break-all text-sm font-medium">{preview.sourceUrl || (isEn ? 'Missing' : '缺失')}</p></div>
              <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-950/50"><p className="text-xs uppercase tracking-[0.2em] opacity-70">{isEn ? 'Risk tags' : '风险标签'}</p><div className="mt-2 flex flex-wrap gap-2">{(preview.riskTags || []).length > 0 ? (preview.riskTags || []).map((tag: string) => <span key={tag} className="rounded-full bg-black/10 px-3 py-1 text-xs font-medium dark:bg-white/10">{tag}</span>) : <span className="text-sm">{isEn ? 'No risk tags' : '无风险标签'}</span>}</div></div>
              <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-950/50"><p className="text-xs uppercase tracking-[0.2em] opacity-70">{isEn ? 'Benefit info' : '福利信息'}</p><p className="mt-2 text-sm leading-6">{preview.benefitInfo || (isEn ? 'Not extracted' : '未提取到')}</p></div>
              <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-950/50"><p className="text-xs uppercase tracking-[0.2em] opacity-70">{isEn ? 'Method' : '薅法说明'}</p><p className="mt-2 text-sm leading-6">{preview.methodText || (isEn ? 'Not extracted' : '未提取到')}</p></div>
              <div className="rounded-2xl bg-white/60 p-4 dark:bg-gray-950/50"><p className="text-xs uppercase tracking-[0.2em] opacity-70">{isEn ? 'Invite code' : '邀请码'}</p><p className="mt-2 text-sm leading-6">{preview.inviteCode || (isEn ? 'None' : '无')}</p></div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
