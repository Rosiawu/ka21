/**
 * Umami 统计组件
 * 
 * 功能描述：
 * 集成 Umami Cloud 统计服务，用于收集网站访问数据
 * 
 * 实现特点：
 * 1. 使用 Next.js 的 Script 组件异步加载统计脚本
 * 2. 设置 afterInteractive 策略确保页面主要内容优先加载
 * 3. 使用 Umami Cloud 服务，无需自托管
 */
'use client';

import Script from 'next/script';

export default function UmamiAnalytics() {
  return (
    <Script
      id="umami-analytics"
      strategy="afterInteractive"
      src="https://cloud.umami.is/script.js"
      data-website-id="5489e3d0-a9b1-4398-8adc-8927457b38fd"
    />
  );
} 