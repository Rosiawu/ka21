// 使用 next-intl 插件并显式指定 request.ts 路径，确保按请求语言加载消息
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const path = require('path');

// Bundle 分析器配置
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mmbiz.qpic.cn',
      },
      {
        protocol: 'http',
        hostname: 'mmecoa.qpic.cn',
      },
      {
        protocol: 'https',
        hostname: 'mmecoa.qpic.cn',
      },
      {
        protocol: 'https',
        hostname: 'thirdwx.qlogo.cn',
      },
      {
        protocol: 'https',
        hostname: 'wx.qlogo.cn',
      },
    ],
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 优化生产环境构建
  productionBrowserSourceMaps: false, // 生产环境不生成 source maps

  // 实验性功能
  experimental: {
    optimizePackageImports: ['@/components'], // 优化组件导入
  },

  // Webpack 配置优化
  webpack: (config, { isServer }) => {
    // 优化包大小
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // 优化模块解析
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Middleware-Subrequest-Id',
          value: 'false'
        },
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ],
    },
  ],
};

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
