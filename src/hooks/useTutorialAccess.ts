"use client";

import { useCallback, useEffect, useState } from 'react';

type TutorialAccessState = {
  authenticated: boolean;
  protectionEnabled: boolean;
};

const DEFAULT_STATE: TutorialAccessState = {
  authenticated: false,
  protectionEnabled: true,
};

export function useTutorialAccess() {
  const [state, setState] = useState<TutorialAccessState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/tutorials/access', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || 'tutorial-access-load-failed');
      }
      setState(result.data as TutorialAccessState);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'tutorial-access-load-failed',
      );
      setState(DEFAULT_STATE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlock = useCallback(
    async (password: string) => {
      setActionPending(true);
      setError('');
      try {
        const response = await fetch('/api/tutorials/access', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        });
        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'tutorial-access-login-failed');
        }
        await refresh();
        return true;
      } catch (unlockError) {
        setError(
          unlockError instanceof Error
            ? unlockError.message
            : 'tutorial-access-login-failed',
        );
        return false;
      } finally {
        setActionPending(false);
      }
    },
    [refresh],
  );

  return {
    ...state,
    loading,
    actionPending,
    error,
    refresh,
    unlock,
  };
}
