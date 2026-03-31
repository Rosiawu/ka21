"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTutorialAccess } from '@/hooks/useTutorialAccess';

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
  return message;
}

export default function TutorialWandButton({ locale }: { locale: string }) {
  const isEn = locale === 'en';
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { authenticated, actionPending, error, unlock } = useTutorialAccess();

  const text = useMemo(
    () => ({
      button: isEn ? 'Tutorial Wand' : '教程魔法棒',
      title: isEn ? 'Unlock tutorial import' : '解锁教程入口',
      description: isEn
        ? 'Enter the password to jump straight into the tutorial import panel.'
        : '输入密码后，会直接进入萌新教程的导入面板。',
      password: isEn ? 'Password' : '密码',
      confirm: isEn ? 'Enter tutorials' : '进入教程页',
      cancel: isEn ? 'Cancel' : '取消',
    }),
    [isEn],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPassword('');
    }
  }, [open]);

  const navigateToTutorialImport = () => {
    setOpen(false);
    router.push(`/${locale}/tutorials?import=1`);
  };

  const handleButtonClick = () => {
    if (authenticated) {
      navigateToTutorialImport();
      return;
    }

    setOpen(true);
  };

  const handleUnlock = async () => {
    if (!password || actionPending) {
      return;
    }

    const ok = await unlock(password);
    if (ok) {
      navigateToTutorialImport();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        aria-label={text.button}
        className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#e06b6b] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(224,107,107,0.2)] transition hover:bg-[#c85a5a] hover:scale-[1.02] sm:bottom-6 sm:right-6"
      >
        <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
        <span className="max-w-[8rem] truncate sm:max-w-none">{text.button}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 px-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white p-5 shadow-2xl dark:bg-gray-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{text.title}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{text.description}</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{text.password}</span>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  autoComplete="current-password"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleUnlock();
                    }
                  }}
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
                  {humanizeError(error, isEn)}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUnlock()}
                  disabled={!password || actionPending}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-400 dark:text-gray-950 dark:hover:bg-sky-300"
                >
                  {text.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
