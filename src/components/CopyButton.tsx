"use client";

import React from 'react';
import useClipboard from '@/hooks/useClipboard';

interface CopyButtonProps {
  text: string;
  label: string;
  copiedLabel?: string;
  failedLabel?: string;
  className?: string;
  enableNativeShare?: boolean;
  preferWechatLaunch?: boolean;
}

export default function CopyButton({
  text,
  label,
  copiedLabel,
  failedLabel,
  className,
  enableNativeShare = false,
  preferWechatLaunch = false
}: CopyButtonProps) {
  const {copy, copied} = useClipboard();
  const [failed, setFailed] = React.useState(false);

  const showTemporaryFailedState = React.useCallback(() => {
    setFailed(true);
    setTimeout(() => setFailed(false), 1500);
  }, []);

  const handleClick = React.useCallback(async () => {
    const shareText = text || (typeof window !== 'undefined' ? window.location.href : '');
    const isWeChatBrowser = typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);
    const isMobileBrowser = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const attemptOpenWeChat = async () => {
      if (typeof window === 'undefined') return false;

      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      let hiddenTriggered = false;

      const onVisibilityChange = () => {
        if (document.hidden) hiddenTriggered = true;
      };
      document.addEventListener('visibilitychange', onVisibilityChange, { once: true });

      // Strategy 1: universal weixin scheme
      window.location.href = 'weixin://';

      if (isAndroid) {
        // Strategy 2: Android intent fallback
        setTimeout(() => {
          window.location.href = 'intent://dl/chat#Intent;scheme=weixin;package=com.tencent.mm;end';
        }, 250);
      } else if (isIOS) {
        // Strategy 2 for iOS: chat deep link
        setTimeout(() => {
          window.location.href = 'weixin://dl/chat';
        }, 250);
      }

      return await new Promise<boolean>((resolve) => {
        setTimeout(() => {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          resolve(hiddenTriggered);
        }, 1200);
      });
    };

    const fallbackToCopyAndHint = async (hintText: string) => {
      const copiedInFallback = await copy(shareText);
      if (copiedInFallback) {
        if (typeof window !== 'undefined') {
          if (preferWechatLaunch && isMobileBrowser && !isWeChatBrowser) {
            const opened = await attemptOpenWeChat();
            if (!opened) {
              window.alert('链接已复制。当前浏览器禁止直接拉起微信，请手动打开微信后粘贴发送。');
              return;
            }
          }
          window.alert(hintText);
        }
        return;
      }

      if (typeof window !== 'undefined') {
        window.prompt('请手动复制以下链接后，在微信中发送：', shareText);
      }
    };

    if (isWeChatBrowser) {
      await fallbackToCopyAndHint('链接已复制。请点击微信右上角“...”后选择“发送给朋友”，并粘贴链接发送。');
      return;
    }

    if (enableNativeShare && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({url: shareText});
        return;
      } catch (e) {
        const isAbort = typeof e === 'object' && e !== null && 'name' in e && (e as {name?: string}).name === 'AbortError';
        if (isAbort) {
          return;
        }
      }
    }

    const ok = await copy(shareText);
    if (ok) {
      if (preferWechatLaunch && isMobileBrowser && typeof window !== 'undefined') {
        const opened = await attemptOpenWeChat();
        if (opened) {
          window.alert('链接已复制，已尝试打开微信。请在微信聊天窗口粘贴并发送。');
        } else {
          window.alert('链接已复制。当前浏览器禁止直接拉起微信，请手动打开微信后粘贴发送。');
        }
      }
      return;
    }

    showTemporaryFailedState();
    if (typeof window !== 'undefined') {
      window.prompt('复制失败，请手动复制以下链接：', shareText);
    }
  }, [copy, enableNativeShare, preferWechatLaunch, showTemporaryFailedState, text]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className || 'inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'}
      aria-live="polite"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
      </svg>
      {failed ? (failedLabel || label) : copied ? (copiedLabel || label) : label}
    </button>
  );
}
