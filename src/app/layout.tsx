import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC } from 'next/font/google';
// 说明：移除 next/font/google，保障离线构建
import Script from 'next/script';
import ErrorBoundary from "@/components/ErrorBoundary";
import ThemeProvider from '@/components/ThemeProvider';
import UmamiAnalytics from '@/components/UmamiAnalytics';
import ClarityAnalytics from '@/components/ClarityAnalytics';

// 优化字体加载
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'KA21工具导航 - 一站式AI资源平台',
    template: '%s',
  },
  description: '发现、比较和使用最佳AI工具，提升您的工作效率和创造力',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/KA21.png',
  },
};

// 根布局：仅承载全局样式/脚本/主题/错误边界等“与语言无关”的外层壳
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* 添加 Font Awesome（全局样式依赖） */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* Script动态注入Impact.com验证代码 */}
        <Script id="impact-verification" strategy="beforeInteractive">
          {`
            const meta = document.createElement('meta');
            meta.name = 'impact-site-verification';
            meta.setAttribute('value', 'bc909a88-910d-46d0-b650-7ac3ae8940ed');
            document.head.appendChild(meta);
          `}
        </Script>


        {/* Umami统计 */}
        <UmamiAnalytics />

        {/* Clarity 分析 */}
        <ClarityAnalytics
          projectId={process.env.NEXT_PUBLIC_CLARITY_ID || ''}
          enableConsent={true}
        />
      </head>
      <body className={`${inter.variable} ${notoSansSC.variable} font-sans antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            {/* 将带有多语言文案的 Header/Sidebar/Footer 移至 src/app/[locale]/layout.tsx 中渲染 */}
            {children}
          </ErrorBoundary>
        </ThemeProvider>

        {/* 页面行为相关脚本已迁移至客户端布局容器组件 */}
      </body>
    </html>
  );
}
