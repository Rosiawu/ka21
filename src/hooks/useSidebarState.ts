import {useEffect, useState, useCallback} from 'react';

export default function useSidebarState(storageKey: string = 'sidebarCollapsed') {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setCollapsed(saved === 'true');
    } catch {
      // ignore storage read errors
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(collapsed));
    } catch {
      // ignore storage write errors
    }
    // 取消自定义事件派发：改为纯 React 状态驱动
  }, [collapsed, storageKey]);

  const toggle = useCallback(() => setCollapsed(v => !v), []);

  return {collapsed, toggle, setCollapsed};
}
