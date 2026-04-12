"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTutorialAccess } from '@/hooks/useTutorialAccess';

type TutorialImportGateProps = {
  locale: 'en' | 'zh';
  title?: string;
  description?: string;
  children: ReactNode;
  onAuthenticatedChange?: (authenticated: boolean) => void;
};

function humanizeError(message: string, isEn: boolean) {
  if (!message) return '';
  if (message === 'invalid-tutorial-access-password') {
    return isEn ? 'Incorrect password.' : '密码不对。';
  }
  if (message === 'rate-limit-exceeded') {
    return isEn ? 'Too many attempts. Try again later.' : '尝试次数过多，稍后再试。';
  }
  if (message === 'tutorial-access-load-failed') {
    return isEn ? 'Could not verify tutorial access.' : '无法确认教程入口状态。';
  }
  if (message === 'tutorial-access-required') {
    return isEn ? 'Enter the password to unlock tutorial import.' : '请输入密码后再使用教程导入。';
  }
  return message;
}

export default function TutorialImportGate({
  locale,
  title,
  description,
  children,
  onAuthenticatedChange,
}: TutorialImportGateProps) {
  const isEn = locale === 'en';
  const {
    authenticated,
    loading,
    actionPending,
    error,
    unlock,
  } = useTutorialAccess();
  const [password, setPassword] = useState('');

  useEffect(() => {
    onAuthenticatedChange?.(authenticated);
  }, [authenticated, onAuthenticatedChange]);

  const text = {
    title: title || (isEn ? 'Tutorial password required' : '需要教程入口密码'),
    description:
      description ||
      (isEn
        ? 'Enter the tutorial wand password to import and save WeChat articles.'
        : '输入教程魔法棒密码后，就可以提取并保存公众号文章。'),
    password: isEn ? 'Password' : '密码',
    unlock: isEn ? 'Unlock tutorial import' : '解锁教程导入',
    loading: isEn ? 'Checking tutorial access...' : '正在检查教程入口状态...',
  };

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-gray-200 bg-white/90 p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
        {text.loading}
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950/85 sm:p-5">
      <div className="max-w-xl space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{text.title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{text.description}</p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.password}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            autoComplete="current-password"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !actionPending) {
                event.preventDefault();
                void unlock(password);
              }
            }}
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
            {humanizeError(error, isEn)}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void unlock(password)}
          disabled={!password || actionPending}
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-400 dark:text-gray-950 dark:hover:bg-sky-300"
        >
          {text.unlock}
        </button>
      </div>
    </div>
  );
}
