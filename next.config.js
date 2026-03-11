// 使用 next-intl 插件并显式指定 request.ts 路径，确保按请求语言加载消息
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

// Bundle 分析器配置
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // 优化生产环境构建
  productionBrowserSourceMaps: false, // 生产环境不生成 source maps

  // 实验性功能
  experimental: {
    optimizePackageImports: ['@/components'], // 优化组件导入
    // 启用 SWC 压缩以获得更好的性能
    swcMinify: true,
  },

  // Webpack 配置优化
  webpack: (config, { isServer, dev }) => {
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

    // 生产环境优化
    if (!dev) {
      // 移除 console.log
      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          },
        })
      );
    }

    return config;
  },

  // 添加安全相关配置
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
