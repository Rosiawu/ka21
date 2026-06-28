"use client";

import AdminSessionGate from '@/components/admin/AdminSessionGate';
import Link from '@/i18n/Link';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

type UploadResult = {
  episode?: {
    title: string;
    pageUrl: string;
    audioUrl: string;
    coverUrl: string;
    slug: string;
  };
  feedUrl?: string;
};

function fileSizeLabel(size: number) {
  if (!size) return '';
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function humanizeError(message: string, isEn: boolean) {
  const zh: Record<string, string> = {
    'missing-title': '标题不能为空。',
    'missing-audio': '需要上传音频。',
    'missing-cover': '需要上传封面。',
    'missing-shownotes': '需要 shownotes 文件或文本。',
    'invalid-audio': '音频格式不对，请上传 MP3、M4A、WAV 等音频文件。',
    'invalid-cover': '封面格式不对，请上传 JPG、PNG 或 WebP。',
    'audio-too-large': '音频超过 90MB。当前版本先走 GitHub 写回，大音频后面要接 R2。',
    'cover-too-large': '封面超过 8MB。',
    'shownotes-too-large': 'Shownotes 文件太大。',
    'admin-auth-required': '需要管理员登录。',
    'rate-limit-exceeded': '提交太频繁了，稍后再试。',
  };
  const en: Record<string, string> = {
    'missing-title': 'Title is required.',
    'missing-audio': 'Audio is required.',
    'missing-cover': 'Cover art is required.',
    'missing-shownotes': 'Shownotes are required.',
    'invalid-audio': 'Unsupported audio file.',
    'invalid-cover': 'Unsupported cover file.',
    'audio-too-large': 'Audio is over 90MB. This GitHub-backed version needs smaller files.',
    'cover-too-large': 'Cover art is over 8MB.',
    'shownotes-too-large': 'Shownotes are too large.',
    'admin-auth-required': 'Admin sign-in is required.',
    'rate-limit-exceeded': 'Too many submissions. Try again later.',
  };
  return (isEn ? en : zh)[message] || message || (isEn ? 'Upload failed.' : '上传失败。');
}

export default function PodcastUploadPageContent({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [pubDate, setPubDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [season, setSeason] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [shownotesFile, setShownotesFile] = useState<File | null>(null);
  const [shownotesText, setShownotesText] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);

  const text = {
    navBack: isEn ? 'Back to podcast' : '返回播客页',
    badge: isEn ? 'Podcast upload' : '播客上传',
    title: isEn ? 'Podcast Upload' : '播客上传',
    subtitle: isEn
      ? 'Upload one episode into the KA21 podcast feed.'
      : '把灯下白的新一期写进牛马库站内 RSS。',
    adminTitle: isEn ? 'Admin sign-in required' : '需要管理员登录',
    adminDescription: isEn
      ? 'Podcast upload writes media files and RSS data to the repository.'
      : '播客上传会把媒体文件和 RSS 数据写入仓库。',
    episodeInfo: isEn ? 'Episode' : '单集信息',
    titleLabel: isEn ? 'Title' : '标题',
    titlePlaceholder: isEn ? 'Episode title' : '灯下白 EP01：和真正做 AI 的人聊天',
    subtitleLabel: isEn ? 'Subtitle' : '副标题',
    slugLabel: 'Slug',
    slugPlaceholder: 'ep01-ai-builder',
    pubDateLabel: isEn ? 'Date' : '发布日期',
    episodeNumberLabel: isEn ? 'Episode no.' : '期数',
    seasonLabel: isEn ? 'Season' : '季数',
    explicitLabel: 'Explicit',
    assets: isEn ? 'Assets' : '上传文件',
    audioLabel: isEn ? 'Audio' : '音频',
    coverLabel: isEn ? 'Cover' : '封面',
    notesFileLabel: isEn ? 'Shownotes file' : 'Shownotes 文件',
    notesLabel: 'Shownotes',
    notesPlaceholder: isEn ? '# Episode notes\n\n...' : '# 本期标题\n\n这里写 shownotes。',
    submit: isEn ? 'Publish to RSS' : '发布到 RSS',
    submitting: isEn ? 'Publishing...' : '发布中...',
    done: isEn ? 'Published. Wait for deployment before opening public links.' : '已经写入。等牛马库自动部署完成后，公网链接会生效。',
    feed: isEn ? 'RSS feed' : 'RSS 地址',
    episodePage: isEn ? 'Episode page' : '单集页面',
    audioUrl: isEn ? 'Audio URL' : '音频地址',
    localLimit: isEn ? 'Current upload cap: audio 90MB, cover 8MB.' : '当前上限：音频 90MB，封面 8MB。',
  };

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && audio && cover && (shownotesText.trim() || shownotesFile));
  }, [title, audio, cover, shownotesText, shownotesFile]);

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setCover(nextFile);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(nextFile ? URL.createObjectURL(nextFile) : '');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !audio || !cover) return;
    setSubmitting(true);
    setMessage('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('slug', slug);
      formData.append('pubDate', pubDate);
      formData.append('episodeNumber', episodeNumber);
      formData.append('season', season);
      formData.append('explicit', explicit ? '1' : '0');
      formData.append('audio', audio);
      formData.append('cover', cover);
      formData.append('shownotesText', shownotesText);
      if (shownotesFile) formData.append('shownotesFile', shownotesFile);

      const response = await fetch('/api/podcast/upload', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        setMessage(humanizeError(payload?.message, isEn));
        return;
      }

      setResult(payload.data);
      setMessage(text.done);
      setTitle('');
      setSubtitle('');
      setSlug('');
      setEpisodeNumber('');
      setSeason('');
      setExplicit(false);
      setAudio(null);
      setCover(null);
      setShownotesFile(null);
      setShownotesText('');
      setCoverPreview('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : humanizeError('', isEn));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell py-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-sky-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.22),_transparent_34%),linear-gradient(135deg,_rgba(240,249,255,0.98),_rgba(255,255,255,0.96))] p-5 shadow-[0_16px_45px_rgba(14,165,233,0.10)] dark:border-sky-700/40 dark:bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(17,24,39,0.96))] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-700/60 dark:bg-gray-900/60 dark:text-sky-300">
            <i className="fas fa-podcast text-[11px]" aria-hidden="true"></i>
            {text.badge}
          </span>
          <h1 className="mt-4 text-3xl font-bold font-serif tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">{text.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{text.subtitle}</p>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/podcast"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
              {text.navBack}
            </Link>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-left text-sm leading-5 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
              <i className="fas fa-gauge-high text-xs" aria-hidden="true"></i>
              {text.localLimit}
            </span>
          </div>
        </section>

        <div className="mt-6">
          <AdminSessionGate
            locale={isEn ? 'en' : 'zh'}
            title={text.adminTitle}
            description={text.adminDescription}
          >
            <section className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/85 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{text.episodeInfo}</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.titleLabel}</span>
                        <input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder={text.titlePlaceholder}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.slugLabel}</span>
                        <input
                          value={slug}
                          onChange={(event) => setSlug(event.target.value)}
                          placeholder={text.slugPlaceholder}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.pubDateLabel}</span>
                        <input
                          type="date"
                          value={pubDate}
                          onChange={(event) => setPubDate(event.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.subtitleLabel}</span>
                        <input
                          value={subtitle}
                          onChange={(event) => setSubtitle(event.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.episodeNumberLabel}</span>
                          <input
                            type="number"
                            min="1"
                            value={episodeNumber}
                            onChange={(event) => setEpisodeNumber(event.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.seasonLabel}</span>
                          <input
                            type="number"
                            min="1"
                            value={season}
                            onChange={(event) => setSeason(event.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </label>
                        <label className="flex items-end">
                          <span className="flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                            <input
                              type="checkbox"
                              checked={explicit}
                              onChange={(event) => setExplicit(event.target.checked)}
                              className="h-4 w-4 accent-sky-500"
                            />
                            {text.explicitLabel}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{text.notesLabel}</h2>
                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.notesFileLabel}</span>
                        <input
                          type="file"
                          accept=".md,.txt,text/markdown,text/plain"
                          onChange={(event) => setShownotesFile(event.target.files?.[0] || null)}
                          className="block w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:file:bg-sky-400 dark:file:text-gray-950"
                        />
                      </label>
                      <textarea
                        value={shownotesText}
                        onChange={(event) => setShownotesText(event.target.value)}
                        placeholder={text.notesPlaceholder}
                        className="min-h-[240px] w-full rounded-[1.5rem] border border-gray-200 bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/70">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{text.assets}</h2>
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.audioLabel}</span>
                        <input
                          type="file"
                          accept="audio/*,video/mp4,.mp3,.m4a,.wav,.flac"
                          onChange={(event) => setAudio(event.target.files?.[0] || null)}
                          className="block w-full rounded-2xl border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:file:bg-sky-400 dark:file:text-gray-950"
                        />
                        {audio ? <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{audio.name} · {fileSizeLabel(audio.size)}</p> : null}
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.coverLabel}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="block w-full rounded-2xl border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:file:bg-sky-400 dark:file:text-gray-950"
                        />
                      </label>
                      {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverPreview} alt="" className="aspect-square w-full rounded-[1.25rem] border border-gray-200 object-cover dark:border-gray-700" />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center rounded-[1.25rem] border border-dashed border-gray-300 bg-white text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-950">
                          <i className="fas fa-image text-2xl" aria-hidden="true"></i>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(14,165,233,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <i className="fas fa-cloud-arrow-up text-xs" aria-hidden="true"></i>
                    {submitting ? text.submitting : text.submit}
                  </button>

                  {message ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      {message}
                    </div>
                  ) : null}

                  {result ? (
                    <div className="space-y-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4 text-sm dark:border-emerald-800/60 dark:bg-emerald-950/20">
                      {result.feedUrl ? (
                        <a href={result.feedUrl} target="_blank" rel="noreferrer" className="block font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-200">
                          {text.feed}
                        </a>
                      ) : null}
                      {result.episode?.pageUrl ? (
                        <a href={result.episode.pageUrl} target="_blank" rel="noreferrer" className="block font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-200">
                          {text.episodePage}
                        </a>
                      ) : null}
                      {result.episode?.audioUrl ? (
                        <a href={result.episode.audioUrl} target="_blank" rel="noreferrer" className="block break-all text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-200">
                          {text.audioUrl}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </aside>
              </div>
            </section>
          </AdminSessionGate>
        </div>
      </div>
    </div>
  );
}
