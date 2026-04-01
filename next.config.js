// 使用 next-intl 插件并显式指定 request.ts 路径，确保按请求语言加载消息
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const fs = require('fs');
const path = require('path');

// Bundle 分析器配置
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

function getNextDevPort() {
  const portFlagIndex = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
  const portFromArg = portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : '';
  const portCandidate = `${portFromArg || process.env.PORT || '3000'}`.trim();

  if (/^\d+$/.test(portCandidate)) {
    return portCandidate;
  }

  return '3000';
}

function getDistDir() {
  if (process.env.NODE_ENV !== 'development') {
    return '.next';
  }

  return `.next-dev-${getNextDevPort()}`;
}

function ensureDevTsconfigPath() {
  if (process.env.NODE_ENV !== 'development') {
    return 'tsconfig.json';
  }

  const port = getNextDevPort();
  const devTsconfigPath = `.tsconfig.next-dev-${port}.json`;
  const devTsconfig = {
    extends: './tsconfig.json',
    include: [
      'next-env.d.ts',
      '**/*.ts',
      '**/*.tsx',
      `.next-dev-${port}/types/**/*.ts`,
      '.next/types/**/*.ts',
    ],
    exclude: ['node_modules'],
  };
  const nextContent = `${JSON.stringify(devTsconfig, null, 2)}\n`;

  try {
    const currentContent = fs.existsSync(devTsconfigPath)
      ? fs.readFileSync(devTsconfigPath, 'utf8')
      : '';

    if (currentContent !== nextContent) {
      fs.writeFileSync(devTsconfigPath, nextContent, 'utf8');
    }
  } catch (error) {
    console.warn('[next.config] Failed to prepare dev tsconfig:', error);
  }

  return devTsconfigPath;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开发环境按端口隔离构建产物，避免多个 next dev 进程共享同一个 .next 目录。
  distDir: getDistDir(),
  // 开发环境把 Next 自动写入的类型路径重定向到端口专属临时 tsconfig，避免污染主配置。
  typescript: {
    tsconfigPath: ensureDevTsconfigPath(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'mmbiz.qpic.cn',
      },
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

if (process.env.NODE_ENV === 'development' && !process.env.CI && !process.env.VERCEL) {
  import('@opennextjs/cloudflare')
    .then((m) => m.initOpenNextCloudflareForDev())
    .catch((error) => {
      console.warn('[next.config] OpenNext Cloudflare dev init skipped:', error);
    });
}
