# 数字生命卡兹克-KA21工具导航

一个专注于展示和分享优质AI工具的现代化导航平台。

## 项目概述

这是一个基于 Next.js 14 开发的AI工具导航网站，采用 App Router 架构，支持完整的国际化（中英双语），旨在帮助用户发现和使用各类AI工具。项目经过持续优化，具备完善的测试体系、现代化的UI设计和强大的功能特性。

### 核心特色

- 🌍 **完整国际化支持**：支持中英双语，自动语言检测和切换，基于 next-intl 实现
- 🤖 **精选AI工具展示**：经过实际测试和严格筛选的优质AI工具，包含详细的使用指南和群友评价
- 🔍 **强大的搜索功能**：支持工具、教程、作者的统一搜索，具备实时搜索统计和快捷键支持
- 📚 **教程资源系统**：独立的教程数据管理，支持分类、难度筛选和技能标签
- 🎨 **现代化UI设计**：响应式设计，支持暗色模式，采用 Tailwind CSS 和 Material Design 原则
- 📊 **多维度分析**：集成 Microsoft Clarity、Umami Cloud 等分析工具（已移除百度统计）
- 🧪 **完善的测试体系**：Jest 单元测试和集成测试，覆盖核心功能
- 🚀 **高性能优化**：代码分割、懒加载、图片优化、SWC 压缩
- 🔒 **安全防护**：内置安全头、权限策略和最佳实践
- 🏆 **热门推荐系统**：精选+兜底池设计，支持"换一换"分页轮播
- 👥 **团队展示**：完整的团队成员介绍页面，展示18位专业成员信息

## 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 9 或更高版本（或 yarn 1.22 或更高版本）

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/your-username/ka21-tools.git
cd ka21-tools

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看结果。

### 构建和部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 运行测试
npm test
```

## AI助手功能配置

项目包含一个AI助手功能，默认已禁用。如需启用，请设置环境变量：

```bash
# 在 .env.local 文件中添加
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=true

# 配置DeepSeek API（可选）
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_api_key_here
NEXT_PUBLIC_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

**AI助手功能包括：**
- 工具查询：输入工具名称获取详细介绍
- 作者查询：输入作者名称查看教程
- AI问答：直接提问AI相关问题
- 使用限制：每日10次免费使用

## 国际化 (i18n)

项目采用 `next-intl` 实现完整的国际化支持：

### 语言配置
- 支持语言：中文（zh）、英文（en）
- 默认语言：中文
- 自动检测：基于 Cookie 和 Accept-Language 头

### 语言切换
- 用户可通过界面上的语言切换器手动切换
- 语言偏好会保存在 Cookie 中
- URL 路径包含语言前缀（如 `/zh/`, `/en/`）

### 消息管理
- 消息文件位于 `messages/` 目录
- 支持命名空间和嵌套结构
- 构建时自动检查翻译完整性

## 数据管理

系统支持两种教程数据管理方式：

1. 传统模式：教程数据嵌套在工具数据的`relatedArticles`字段中
2. 解耦模式：教程数据独立存储在`tutorials.json`文件中，并通过`relatedTools`字段关联工具

可以通过修改`src/lib/config.ts`中的`USE_NEW_TUTORIALS_SOURCE`配置来切换数据源。

## 文档导航

### 核心文档
- [功能列表](./docs/功能列表.md) - 详细功能说明与实现状态
- [技术架构](./docs/技术架构.md) - 项目技术栈与架构设计
- [数据结构](./docs/数据结构.md) - 数据模型与类型定义

### 开发规范
- [**快速入门指南**](./docs/快速入门指南.md) - 新开发者必读的快速入门指南
- [开发规范](./docs/开发规范.md) - 完整的项目开发规范和代码标准
- [代码审查清单](./docs/代码审查清单.md) - 代码审查检查清单和质量标准
- [开发指南](./docs/开发指南.md) - 详细开发与贡献流程

### 功能文档
- [自定义属性](./docs/自定义属性.md) - 为相关文章设置自定义属性的指南
- [脚本工具](./docs/脚本工具.md) - 项目脚本工具使用说明
- [**Clarity 设置指南**](./docs/Clarity-设置指南.md) - Microsoft Clarity 分析工具配置与使用说明

### 部署和维护
- [部署指南](./docs/部署指南.md) - 部署流程与最佳实践

### 项目记录
- [更新日志](./docs/更新日志.md) - 项目版本与更新历史
- [工作日志](./docs/archive/工作日志.md) - 详细的项目工作日志（已归档）

### 归档文档
- [类型变更记录](./docs/archive/类型变更记录.md) - 历史类型变更记录
- [Vercel配置备份](./docs/archive/Vercel配置备份.md) - 域名重定向配置备份

## 项目结构

```
src/
├── app/                 # App Router 路由
│   ├── [locale]/       # 国际化路由
│   ├── about/          # 关于页面
│   ├── llm-articles/   # LLM文章页面
│   ├── search/         # 搜索页面
│   ├── test-clarity/   # Clarity测试页面
│   ├── tools/          # 工具页面
│   ├── tutorials/      # 教程页面
│   └── unified-search/ # 统一搜索页面
├── components/         # React 组件
│   ├── hot/           # 热门推荐组件
│   ├── pages/         # 页面级组件
│   └── ui/            # UI组件
├── hooks/             # 自定义 Hooks
├── i18n/              # 国际化配置
├── lib/               # 通用工具与类型
├── data/              # 数据文件
└── types/             # TypeScript 类型声明

scripts/               # 根目录脚本
├── archive/          # 归档的历史脚本
├── check-urls.js     # URL有效性检查
├── convert-icons.js  # 图标转换
├── validate-featured.ts # 精选配置校验
└── check-i18n-keys.ts # 国际化键检查

__tests__/             # 测试文件
messages/              # 国际化消息文件
public/                # 静态资源
docs/                  # 项目文档
└── archive/          # 归档文档
```

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

支持所有现代浏览器的最新版本，包括移动端浏览器。

## 贡献指南

欢迎提交Pull Request来改进项目。详细流程请参考[开发指南](./docs/开发指南.md)。

### 开发环境设置

推荐使用 VSCode 并安装以下插件：
- TypeScript Importer
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Jest Runner

## 许可证

MIT License

## 最新优化（2025年10月更新）

### 代码质量提升
- **依赖清理**：移除未使用的依赖包，减少项目体积
- **测试整合**：合并重复的测试文件，提高测试效率，当前包含45个测试文件
- **类型安全**：强化 TypeScript 类型检查，减少运行时错误
- **代码规范**：统一代码风格，使用 ESLint + TypeScript ESLint
- **构建优化**：启用 SWC 压缩和 Terser 优化，生产环境移除 console.log

### 国际化优化
- **集中配置**：创建 `src/i18n/config.ts` 统一管理语言配置
- **健壮的语言协商**：改进 Accept-Language 解析，支持 q 值权重
- **Cookie 标准化**：优化语言偏好 Cookie 的设置和管理
- **翻译完整性检查**：构建时自动检查各语言文件的键一致性
- **消息管理**：支持命名空间和嵌套结构，便于维护

### 性能优化
- **代码分割**：按路由和组件进行代码分割，优化包大小
- **图片优化**：使用 Next.js Image 组件和 Sharp 优化图片加载
- **缓存策略**：合理配置浏览器缓存和 CDN 缓存
- **Bundle分析**：集成 @next/bundle-analyzer 进行包大小分析
- **字体优化**：使用 Inter 和 Noto Sans SC 字体，支持 display: swap

### 安全增强
- **安全头配置**：添加 X-Frame-Options、X-Content-Type-Options 等安全头
- **权限策略**：限制摄像头、麦克风等敏感权限
- **压缩优化**：启用 Gzip 压缩和资源优化
- **Source Maps**：生产环境禁用 source maps，保护源码

### 功能增强
- **热门推荐系统**：实现精选+兜底池设计，支持"换一换"分页轮播
- **团队展示页面**：完整的团队成员介绍，支持渐进式展开卡片设计
- **搜索功能优化**：统一搜索、实时统计、快捷键支持
- **教程系统**：独立数据管理，支持分类、难度和技能标签筛选
- **响应式设计**：移动端优化，可折叠侧边栏，触摸友好的交互

## 主要页面

- `/`：首页（热门推荐、工具分类、教程轮播、统计展示）
- `/[locale]/search`：工具搜索与分类筛选页（支持URL参数驱动筛选）
- `/[locale]/unified-search`：统一搜索（同时检索工具与教程，支持快捷键）
- `/[locale]/tutorials`：教程中心（关键词/分类/难度/技能筛选，支持水平滚动）
- `/[locale]/tools/[id]`：工具详情（使用指南、群友点评、相关文章/教程）
- `/[locale]/llm-articles`：大模型相关文章展示
- `/[locale]/about`：关于我们（18位团队成员展示，渐进式展开设计）
- `/[locale]/test-clarity`：Clarity 连通性与状态检查页面

### 页面特性
- **响应式布局**：所有页面支持移动端、平板和桌面端适配
- **暗色模式**：基于 next-themes 的完整暗色模式支持
- **国际化路由**：所有页面支持中英双语路由
- **SEO优化**：完整的元数据和结构化数据支持
- **无障碍访问**：符合WCAG标准的可访问性设计

## 环境变量

在项目根目录创建 `.env.local`（本地开发）或在部署平台设置以下变量：

### 必需
- `NEXT_PUBLIC_CLARITY_ID`：Microsoft Clarity 项目 ID（用于行为分析）

### 可选
- `NEXT_PUBLIC_DEEPSEEK_API_KEY`：供 `ChatWidget` 使用的大模型 API Key
- `NEXT_PUBLIC_DEEPSEEK_API_URL`：大模型服务地址（默认 `https://api.deepseek.com/v1/chat/completions`）
- `NEXT_PUBLIC_ENABLE_AI_ASSISTANT`：是否启用 AI 助手（默认 false）

示例：

```
NEXT_PUBLIC_CLARITY_ID=your-clarity-project-id
NEXT_PUBLIC_DEEPSEEK_API_KEY=your-deepseek-key
NEXT_PUBLIC_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=true
```

## 构建校验与脚本

### 自动化校验
- `prebuild`：构建前自动执行
  - 精选配置校验：`scripts/validate-featured.ts`
  - 国际化键检查：`scripts/check-i18n-keys.ts`

### 可用脚本
```bash
npm run dev              # 启动开发服务器
npm run build            # 生产构建（包含 prebuild 校验）
npm run build:analyze    # 构建并分析包大小
npm run start            # 启动生产服务器
npm run test             # 运行测试
npm run test:watch       # 监听模式运行测试
npm run lint             # 运行 ESLint
npm run validate-featured # 单独运行精选配置校验
npm run check-i18n-keys  # 单独运行国际化键检查
npm run convert-icons    # 转换图标格式
npm run optimize-images  # 优化图片资源
```

### 数据管理脚本
- `scripts/validate-featured.ts`：验证精选工具配置的完整性
- `scripts/check-i18n-keys.ts`：检查国际化翻译键的一致性
- `scripts/convert-icons.js`：图标格式转换和优化
- `scripts/optimize-images.js`：图片资源优化
- `scripts/check-urls.js`：检查工具链接的有效性

## 代码风格与约定

### 核心原则
- **简单可读**：就近添加必要注释，避免过度防御式编码
- **SOLID + DRY**：职责单一、去重复用，抽取 Hook/Util/可复用组件
- **最少状态**：仅保留核心状态，其余均由数据派生
- **数据驱动渲染**：UI 从核心数据与派生值计算，不依赖外部中间状态
- **就近管理**：状态在最接近使用它的组件内管理，避免不必要的提升与层层传递
- **类型安全**：充分利用 TypeScript 的类型系统，减少运行时错误

### 组件规范
- **函数式组件**：优先使用函数式组件和 Hooks
- **Props类型定义**：所有组件必须有明确的 TypeScript 接口定义
- **默认导出**：组件使用默认导出，便于 tree-shaking
- **错误边界**：关键组件使用 ErrorBoundary 包装
- **性能优化**：合理使用 React.memo、useMemo、useCallback

### 文件组织
- **组件分类**：按功能分类存放（ui/、pages/、hot/等）
- **类型定义**：统一在 `src/types/` 目录管理
- **工具函数**：通用工具函数放在 `src/lib/utils/`
- **样式管理**：使用 Tailwind CSS，避免内联样式
- **图片资源**：静态图片放在 `public/` 目录，按类型分类

### 提交规范
- **语义化提交**：使用 Conventional Commits 规范
- **代码审查**：所有 PR 必须通过代码审查
- **测试覆盖**：新功能必须包含相应的测试用例
- **文档更新**：重要变更需要更新相关文档

## 分析与监测

- **Microsoft Clarity**：用户行为分析和热力图
- **Umami Cloud**：网站访问统计
- **测试覆盖率**：Jest 单元测试覆盖核心功能

## 性能指标

项目目标达到以下 Core Web Vitals 指标：
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s

### 性能优化措施
- **代码分割**：按路由和组件进行懒加载
- **图片优化**：Next.js Image 组件 + Sharp 处理
- **字体优化**：使用 font-display: swap 预加载关键字体
- **缓存策略**：合理的浏览器缓存和 CDN 配置
- **Bundle优化**：Tree-shaking、压缩、移除未使用代码
- **监控分析**：集成 Bundle Analyzer 进行持续优化

## 技术栈

### 核心框架
- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 3.3
- **国际化**：next-intl 4.3.12
- **主题管理**：next-themes 0.4.6

### 开发工具
- **测试**：Jest 29.7.0 + Testing Library
- **代码规范**：ESLint 8 + TypeScript ESLint
- **构建分析**：@next/bundle-analyzer
- **代码压缩**：TerserWebpackPlugin
- **图标处理**：Font Awesome 6.4.0

### 数据与网络
- **HTTP客户端**：Axios 1.8.2
- **Markdown渲染**：react-markdown 10.1.0
- **图片处理**：Sharp 0.34.4

### 分析与监控
- **用户行为分析**：@microsoft/clarity 1.0.0
- **访问统计**：Umami Cloud
- **性能监控**：内置 Core Web Vitals 监控

### 部署平台
- **推荐部署**：Vercel
- **替代方案**：任何支持 Node.js 18.17+ 的平台
