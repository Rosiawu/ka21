"use client"; // 客户端组件：Clarity 状态监控，支持本地化文案

import { useEffect, useState } from 'react';
import {useTranslations} from 'next-intl';

interface ClarityStatus {
  isInitialized: boolean;
  hasNetworkActivity: boolean;
  lastActivity: string;
  eventCount: number;
}

export default function ClarityNetworkMonitor() {
  const t = useTranslations('Clarity');
  const [status, setStatus] = useState<ClarityStatus>({
    isInitialized: false,
    hasNetworkActivity: false,
    lastActivity: '无',
    eventCount: 0
  });

  useEffect(() => {
    let eventCounter = 0;
    
    // 检查 Clarity 是否已初始化
    const checkClarityStatus = () => {
      const clarityExists = Boolean((window as unknown as Record<string, unknown>)['clarity']);
      setStatus(prev => ({
        ...prev,
        isInitialized: clarityExists
      }));
    };

    // 监控控制台日志来检测 Clarity 活动
    const originalConsoleLog = console.log;
    console.log = function(...args: unknown[]) {
      const message = args.map(String).join(' ');
      
      if (message.includes('Clarity') || message.includes('clarity')) {
        eventCounter++;
        setStatus(prev => ({
          ...prev,
          hasNetworkActivity: true,
          lastActivity: new Date().toLocaleTimeString(),
          eventCount: eventCounter
        }));
      }
      
      return originalConsoleLog.apply(console, args);
    };

    // 简单的网络活动检测
    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('clarity.ms')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🌐 检测到 Clarity 网络请求:', url);
        }
        setStatus(prev => ({
          ...prev,
          hasNetworkActivity: true,
          lastActivity: new Date().toLocaleTimeString(),
          eventCount: prev.eventCount + 1
        }));
      }
      
      return originalFetch.call(this, input, init);
    };

    // 初始状态检查
    checkClarityStatus();
    
    // 定期检查状态
    const interval = setInterval(checkClarityStatus, 1000);

    // 清理函数
    return () => {
      clearInterval(interval);
      console.log = originalConsoleLog;
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-2 flex items-center">
        {t('monitorTitle')}
      </h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{t('initLabel')}</span>
          <span className={status.isInitialized ? 'text-green-600' : 'text-red-600'}>
            {status.isInitialized ? t('initYes') : t('initNo')}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>{t('networkLabel')}</span>
          <span className={status.hasNetworkActivity ? 'text-green-600' : 'text-gray-500'}>
            {status.hasNetworkActivity ? t('networkYes') : t('networkWait')}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>{t('lastActivity')}</span>
          <span className="text-gray-600">{status.lastActivity}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>{t('eventCount')}</span>
          <span className="text-blue-600">{status.eventCount}</span>
        </div>
      </div>
      
      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
        {t('tip')}
      </div>
      
      {status.isInitialized && (
        <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
          {t('ok')}
        </div>
      )}
    </div>
  );
}
