# next-themes 集成待办

## 准备
- [x] 盘点当前暗色模式实现（`src/app/layout.tsx` 脚本、`globals.css` 中的变量、组件内的主题检查）
  - `src/app/layout.tsx`：头部按钮绑定 `#darkModeToggle`，内联脚本在 `DOMContentLoaded` 后通过 `document.documentElement.classList.toggle('dark')` 切换，并维护 `updateDarkModeTags()`。
  - `src/app/globals.css`：`:root` 和 `.dark` 下维护主题变量；大量 `.dark` 选择器增强文字和标签对比；`@media (prefers-color-scheme: dark)` 仅处理标签。
  - 组件：`DynamicLogo`/`DynamicFavicon` 监听 `MutationObserver` 判断 `dark` class；`AiTagBadge` 和多处 `dark:` Tailwind 类依赖脚本给出的 `.dark-mode-tag`。
- [x] 确认需要保留或重构的暗色标签样式逻辑（`AiTagBadge` 等）
  - `AiTagBadge` 依赖 `data-dark-style` 与布局脚本；需要改造为根据主题在 React 内计算样式。
  - 其他标签类（`SkillTag`, `ToolList` 等）主要用 Tailwind `dark:`，无需额外逻辑；但需确认是否还需要 `.dark-mode-tag` 工具函数。

## 实施
- [x] 安装 `next-themes` 依赖
- [x] 新建主题 Provider 组件（例如 `src/components/ThemeProvider.tsx`）封装 `ThemeProvider` 设置（`attribute="class"`、`defaultTheme="system"`、`enableSystem` 等）
  - [x] 在 `src/app/layout.tsx` 中引入 Provider，包裹整个应用，移除内联脚本中的手动 `classList.toggle('dark')`（改为监听 `html` class 变化）
- [x] 调整暗色模式开关按钮为独立的客户端组件，使用 `useTheme()` 调用 `setTheme('light' | 'dark' | 'system')`
- [x] 更新 `DynamicLogo` 等依赖 DOM 观察的组件，改用 `useTheme()` 读取当前主题
- [x] 校正标签/Badge 组件对暗色模式的响应，避免依赖已移除的 `updateDarkModeTags`

## 清理
- [x] 删除 `layout.tsx` 中多余的 MutationObserver / `updateDarkModeTags` 逻辑
- [x] 检查并删除不再需要的 CSS（例如 `.dark .dark-mode-tag` 的内联样式注入，如果改用纯 Tailwind 或 CSS 变量）

## 验证
- [ ] 本地运行应用，确认暗色/亮色/系统模式切换正常且持久化（容器内端口受限，需在宿主执行 `npm run dev` 手动巡检）
- [x] 回归现有测试，必要时新增主题相关测试
- [x] 更新 caniuse-lite 并确认构建无警告
