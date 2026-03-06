import { useEffect, useMemo, useState } from 'react';

type WeChatShareOptions = {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
};

type WeChatConfigPayload = {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
};

type WeChatError = {
  errMsg?: string;
};

type WeChatSDK = {
  config: (options: {
    debug?: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }) => void;
  ready: (callback: () => void) => void;
  error: (callback: (error: WeChatError) => void) => void;
  updateAppMessageShareData?: (options: WeChatShareOptions) => void;
  updateTimelineShareData?: (options: WeChatShareOptions) => void;
  onMenuShareAppMessage?: (options: WeChatShareOptions) => void;
  onMenuShareTimeline?: (options: WeChatShareOptions) => void;
  showOptionMenu?: () => void;
};

declare global {
  interface Window {
    wx?: WeChatSDK;
  }
}

const WECHAT_JS_SDK_SRC = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
const WECHAT_SCRIPT_ID = 'wechat-jssdk-script';

function isWeChatBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}

function loadWeChatScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.wx) return Promise.resolve();

  const existingScript = document.getElementById(WECHAT_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript?.dataset.loaded === 'true') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('wechat-script-load-failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = WECHAT_SCRIPT_ID;
    script.src = WECHAT_JS_SDK_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('wechat-script-load-failed'));
    document.head.appendChild(script);
  });
}

function applyShareData(wx: WeChatSDK, shareData: WeChatShareOptions) {
  wx.showOptionMenu?.();
  wx.updateAppMessageShareData?.(shareData);
  wx.updateTimelineShareData?.(shareData);
  wx.onMenuShareAppMessage?.(shareData);
  wx.onMenuShareTimeline?.(shareData);
}

export default function useWeChatShare(shareData: WeChatShareOptions) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWeChat = useMemo(() => isWeChatBrowser(), []);

  useEffect(() => {
    let cancelled = false;

    const initWeChatShare = async () => {
      if (!isWeChat || typeof window === 'undefined') {
        return;
      }

      try {
        setReady(false);
        setError(null);

        await loadWeChatScript();
        const wx = window.wx;
        if (!wx) {
          throw new Error('wechat-sdk-unavailable');
        }

        const signUrl = window.location.href.split('#')[0];
        const response = await fetch(`/api/wechat/jssdk-signature?url=${encodeURIComponent(signUrl)}`, {
          cache: 'no-store'
        });
        const result = await response.json();
        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(result?.message || 'wechat-signature-failed');
        }

        const { appId, timestamp, nonceStr, signature } = result.data as WeChatConfigPayload;
        wx.config({
          debug: false,
          appId,
          timestamp,
          nonceStr,
          signature,
          jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'onMenuShareAppMessage',
            'onMenuShareTimeline',
            'showOptionMenu'
          ]
        });

        wx.ready(() => {
          if (cancelled) return;
          applyShareData(wx, shareData);
          setReady(true);
        });

        wx.error((err) => {
          if (cancelled) return;
          setReady(false);
          setError(err?.errMsg || 'wechat-config-error');
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'wechat-share-init-failed';
        setReady(false);
        setError(message);
      }
    };

    initWeChatShare();
    return () => {
      cancelled = true;
    };
  }, [isWeChat, shareData]);

  return { isWeChat, ready, error };
}
