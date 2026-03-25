"use client";

import { useCallback, useEffect, useState } from 'react';

type SessionMode = 'development-open' | 'interactive' | 'bearer-only' | 'disabled';

type SessionState = {
  authenticated: boolean;
  interactiveAvailable: boolean;
  protectionEnabled: boolean;
  mode: SessionMode;
};

const DEFAULT_STATE: SessionState = {
  authenticated: false,
  interactiveAvailable: false,
  protectionEnabled: false,
  mode: 'disabled',
};

export function useAdminSession() {
  const [state, setState] = useState<SessionState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || 'admin-session-load-failed');
      }
      setState(result.data as SessionState);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'admin-session-load-failed');
      setState(DEFAULT_STATE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      setActionPending(true);
      setError('');
      try {
        const response = await fetch('/api/admin/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'admin-login-failed');
        }
        await refresh();
        return true;
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : 'admin-login-failed');
        return false;
      } finally {
        setActionPending(false);
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    setActionPending(true);
    setError('');
    try {
      await fetch('/api/admin/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      await refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'admin-logout-failed');
    } finally {
      setActionPending(false);
    }
  }, [refresh]);

  return {
    ...state,
    loading,
    actionPending,
    error,
    refresh,
    login,
    logout,
  };
}
