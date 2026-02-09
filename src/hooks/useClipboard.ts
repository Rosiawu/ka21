import {useCallback, useState} from 'react';

export default function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(undefined);
      setTimeout(() => setCopied(false), 1500);
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Copy failed');
      setError(err);
      setCopied(false);
      return false;
    }
  }, []);

  return {copy, copied, error};
}

