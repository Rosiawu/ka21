"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from '@/i18n/Link';

const CONTRIBUTOR_ID_KEY = 'ka21_deals_contributor_id';
const CONTRIBUTOR_NICKNAME_KEY = 'ka21_deals_contributor_nickname';
const CONTRIBUTOR_AVATAR_KEY = 'ka21_deals_contributor_avatar';

export type BoundContributor = {
  id: string;
  nickname: string;
  avatarUrl: string;
};

function readContributorFromStorage(): BoundContributor | null {
  if (typeof window === 'undefined') return null;
  const id = window.localStorage.getItem(CONTRIBUTOR_ID_KEY);
  const nickname = window.localStorage.getItem(CONTRIBUTOR_NICKNAME_KEY);
  const avatarUrl = window.localStorage.getItem(CONTRIBUTOR_AVATAR_KEY);
  if (!id || !nickname || !avatarUrl) return null;
  return { id, nickname, avatarUrl };
}

function persistContributor(contributor: BoundContributor) {
  window.localStorage.setItem(CONTRIBUTOR_ID_KEY, contributor.id);
  window.localStorage.setItem(CONTRIBUTOR_NICKNAME_KEY, contributor.nickname);
  window.localStorage.setItem(CONTRIBUTOR_AVATAR_KEY, contributor.avatarUrl);
}

export function getBoundContributorId() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(CONTRIBUTOR_ID_KEY) || '';
}

export function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem('ka21_deals_visitor_id');
  if (existing) return existing;
  const generated = `visitor_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem('ka21_deals_visitor_id', generated);
  return generated;
}

export default function ContributorBinder({ locale, onBound }: { locale: string; onBound?: (contributor: BoundContributor) => void }) {
  const isEn = locale === 'en';
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [boundContributor, setBoundContributor] = useState<BoundContributor | null>(null);

  useEffect(() => {
    const localContributor = readContributorFromStorage();
    if (localContributor) {
      setBoundContributor(localContributor);
      setNickname(localContributor.nickname);
      setAvatarUrl(localContributor.avatarUrl);
      onBound?.(localContributor);
    }
  }, [onBound]);

  const bindIdentity = async () => {
    if (!nickname.trim()) {
      setMessage(isEn ? 'Nickname is required.' : '请先填写昵称。');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/deals/contributors/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributorId: boundContributor?.id || '', nickname, avatarUrl }),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(result.message || (isEn ? 'Bind failed.' : '绑定失败。'));
        return;
      }
      const contributor = result.data as BoundContributor;
      persistContributor(contributor);
      setBoundContributor(contributor);
      setNickname(contributor.nickname);
      setAvatarUrl(contributor.avatarUrl);
      setMessage(isEn ? 'Identity ready.' : '身份已准备好。');
      onBound?.(contributor);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEn ? 'Bind failed.' : '绑定失败。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/95 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">{isEn ? 'Identity' : '投稿身份'}</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Bind a contributor profile for this device' : '先给这台设备绑定一个投稿身份'}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{isEn ? 'Current repo snapshot keeps the web binder first. Miniapp QR binding is the next integration step.' : '当前仓库版本先保留网页绑定入口。微信小程序扫码绑定是下一步接入点。'}</p>
        </div>
        {boundContributor && <Link href={`/contributors/${boundContributor.id}`} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/60 dark:text-emerald-300"><span>{isEn ? 'My profile' : '查看我的主页'}</span></Link>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input type="text" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder={isEn ? 'Nickname' : '昵称'} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
        <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder={isEn ? 'Avatar URL (optional)' : '头像 URL（可留空）'} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
        <button type="button" onClick={bindIdentity} disabled={saving} className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900">{saving ? (isEn ? 'Saving...' : '保存中...') : (isEn ? 'Bind' : '绑定身份')}</button>
      </div>

      {boundContributor && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-900/70">
          <img src={boundContributor.avatarUrl} alt={boundContributor.nickname} className="h-12 w-12 rounded-full border border-white/70 object-cover shadow-sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{boundContributor.nickname}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {boundContributor.id}</p>
          </div>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{message}</p>}
    </section>
  );
}
