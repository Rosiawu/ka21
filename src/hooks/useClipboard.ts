import {useCallback, useState} from 'react';

export default function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const copy = useCallback(async (text: string) => {
    const fallbackCopy = (value: string) => {
      if (typeof document === 'undefined') {
        return false;
      }

      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      let copiedWithFallback = false;
      try {
        copiedWithFallback = document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }

      return copiedWithFallback;
    };

    try {
      if (!text) {
        throw new Error('No text to copy');
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!fallbackCopy(text)) {
        throw new Error('Clipboard API unavailable');
      }

      setCopied(true);
      setError(undefined);
      setTimeout(() => setCopied(false), 1500);
      return true;
    } catch (e) {
      const copiedWithFallback = fallbackCopy(text);
      if (copiedWithFallback) {
        setCopied(true);
        setError(undefined);
        setTimeout(() => setCopied(false), 1500);
        return true;
      }

      const err = e instanceof Error ? e : new Error('Copy failed');
      setError(err);
      setCopied(false);
      return false;
    }
  }, []);

  return {copy, copied, error};
}
