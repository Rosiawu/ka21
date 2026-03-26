"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAdminSession } from '@/hooks/useAdminSession';

type AdminSessionGateProps = {
  locale: 'en' | 'zh';
  title?: string;
  description?: string;
  children: ReactNode;
  onAuthenticatedChange?: (authenticated: boolean) => void;
};

function humanizeError(message: string, isEn: boolean) {
  if (!message) return '';
  if (message === 'invalid-admin-credentials') {
    return isEn ? 'Incorrect admin credentials.' : '管理员账号或密码不对。';
  }
  if (message === 'interactive-admin-auth-unavailable') {
    return isEn
      ? 'Interactive admin login is not configured on the server.'
      : '服务端还没有配置浏览器端管理员登录。';
  }
  if (message === 'rate-limit-exceeded') {
    return isEn ? 'Too many attempts. Try again later.' : '尝试次数过多，稍后再试。';
  }
  if (message === 'admin-session-load-failed') {
    return isEn ? 'Could not load admin session state.' : '无法读取管理员会话状态。';
  }
  return message;
}

export default function AdminSessionGate({
  locale,
  title,
  description,
  children,
  onAuthenticatedChange,
}: AdminSessionGateProps) {
  const isEn = locale === 'en';
  const {
    authenticated,
    interactiveAvailable,
    mode,
    loading,
    actionPending,
    error,
    login,
    logout,
  } = useAdminSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    onAuthenticatedChange?.(authenticated);
  }, [authenticated, onAuthenticatedChange]);

  const text = {
    title: title || (isEn ? 'Admin access required' : '需要管理员登录'),
    description:
      description ||
      (isEn
        ? 'This operation writes content or triggers expensive server-side work. Sign in before using it.'
        : '这个入口会写入内容或触发高开销服务端任务，先登录管理员会话再用。'),
    username: isEn ? 'Username' : '用户名',
    password: isEn ? 'Password' : '密码',
    login: isEn ? 'Sign in' : '登录',
    logout: isEn ? 'Sign out' : '退出登录',
    loading: isEn ? 'Checking admin session...' : '正在检查管理员会话...',
    configuredMissing: isEn
      ? 'Server-side interactive admin login is not configured yet.'
      : '服务端还没配好浏览器端管理员登录。',
    developmentOpen: isEn
      ? 'Local development is open because no admin secret is configured.'
      : '当前是本地开发模式，且未配置管理员密钥，因此已放行。',
    signedIn: isEn ? 'Admin session active.' : '管理员会话已生效。',
  };

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-gray-200 bg-white/90 p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
        {text.loading}
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-200">
          <div>
            <p className="font-semibold">{mode === 'development-open' ? text.developmentOpen : text.signedIn}</p>
            {description ? <p className="mt-1 text-emerald-700/90 dark:text-emerald-200/80">{description}</p> : null}
          </div>
          {mode !== 'development-open' ? (
            <button
              type="button"
              onClick={() => void logout()}
              disabled={actionPending}
              className="rounded-full border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
            >
              {text.logout}
            </button>
          ) : null}
        </div>
        {children}
      </div>
    );
  }

  if (!interactiveAvailable) {
    return (
      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100">
        <p className="font-semibold">{text.title}</p>
        <p className="mt-2">{text.configuredMissing}</p>
        {error ? <p className="mt-2 text-amber-700 dark:text-amber-200">{humanizeError(error, isEn)}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-950/85 sm:p-5">
      <div className="max-w-xl space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{text.title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{text.description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.username}</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              autoComplete="username"
            />
          </label>
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
                  void login(username, password);
                }
              }}
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
            {humanizeError(error, isEn)}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void login(username, password)}
          disabled={!username.trim() || !password || actionPending}
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-400 dark:text-gray-950 dark:hover:bg-sky-300"
        >
          {text.login}
        </button>
      </div>
    </div>
  );
}
