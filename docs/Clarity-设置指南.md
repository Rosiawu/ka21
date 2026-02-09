# Clarity 分析工具设置指南

## 概述

Microsoft Clarity 是一个免费的行为分析工具，可以帮助你深入了解用户在你的网站上的行为。通过会话回放、热力图、洞察和 Clarity Copilot 功能，你可以获得智能摘要和可操作的洞察，帮助你更有效地优化网站并做出数据驱动的决策。

## 安装步骤

### 1. 安装依赖

```bash
npm install @microsoft/clarity
```

### 2. 获取项目 ID

1. 访问 [Microsoft Clarity](https://clarity.microsoft.com/)
2. 创建新项目或选择现有项目
3. 进入 **项目设置 > 概览**
4. 复制 **项目 ID**

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_CLARITY_ID=your_clarity_project_id_here
```

**注意：** 将 `your_clarity_project_id_here` 替换为你的实际项目 ID。

### 4. 集成到项目中

Clarity 已经自动集成到你的 `layout.tsx` 中，无需额外配置。

## 使用方法

### 基本跟踪

Clarity 会自动跟踪：
- 页面浏览
- 用户点击
- 滚动行为
- 表单交互
- 会话回放

### 自定义跟踪

使用提供的工具函数进行自定义跟踪：

```typescript
import { 
  trackPageView, 
  trackUserAction, 
  setTag, 
  identifyUser 
} from '@/utils/clarity';

// 跟踪页面浏览
trackPageView('工具详情页', 'tool-detail-123');

// 跟踪用户行为
trackUserAction('tool_click', {
  tool_name: 'ChatGPT',
  category: 'AI对话'
});

// 设置自定义标签
setTag('user_type', 'premium');

// 识别用户
identifyUser('user123', 'session456', 'page789', '张三');
```

### 在组件中使用

```typescript
'use client';

import { useEffect } from 'react';
import { trackPageView, trackUserAction } from '@/utils/clarity';

export default function MyComponent() {
  useEffect(() => {
    // 页面加载时跟踪
    trackPageView('我的组件页面');
  }, []);

  const handleButtonClick = () => {
    // 跟踪按钮点击
    trackUserAction('button_click', {
      button_name: '提交按钮',
      page: '表单页面'
    });
  };

  return (
    <button onClick={handleButtonClick}>
      点击我
    </button>
  );
}
```

## 主要功能

### 1. 会话回放
- 查看用户如何与你的网站交互
- 识别用户遇到的困难和问题
- 优化用户体验

### 2. 热力图
- 了解用户最常点击的区域
- 识别页面上的热点和冷点
- 优化页面布局和内容

### 3. 洞察
- 自动识别用户行为模式
- 发现潜在的用户体验问题
- 提供优化建议

### 4. Clarity Copilot
- AI 驱动的智能分析
- 自动生成用户行为摘要
- 提供可操作的优化建议

## 隐私和合规

### Cookie 同意

Clarity 支持 cookie 同意管理：

```typescript
import { setConsent } from '@/utils/clarity';

// 设置用户同意
setConsent(true);

// 撤销同意
setConsent(false);
```

### 数据安全

- Clarity 使用安全的 HTTPS 连接
- 所有数据都经过加密传输
- 符合 GDPR 和其他隐私法规要求

## 最佳实践

### 1. 合理使用标签
- 使用有意义的标签名称
- 避免过度跟踪
- 关注对业务有价值的数据

### 2. 事件命名规范
- 使用一致的命名约定
- 例如：`user_action_tool_click`、`page_view_home`

### 3. 性能优化
- 避免在循环中调用跟踪函数
- 使用防抖处理频繁事件
- 合理设置标签数量

### 4. 测试和验证
- 在开发环境中测试跟踪功能
- 验证数据是否正确发送
- 检查 Clarity 仪表板中的数据

## 故障排除

### 常见问题

1. **Clarity 未初始化**
   - 检查项目 ID 是否正确
   - 确认环境变量已设置
   - 查看浏览器控制台错误信息

2. **数据未显示**
   - 等待几分钟让数据同步
   - 检查网络连接
   - 确认没有广告拦截器阻止

3. **性能问题**
   - 减少跟踪调用频率
   - 优化标签设置
   - 使用防抖处理

### 调试模式

在开发环境中，Clarity 会在控制台输出调试信息，帮助你排查问题。

## 支持资源

- [Clarity 官方文档](https://docs.microsoft.com/en-us/clarity/)
- [Clarity 支持邮箱](mailto:clarityms@microsoft.com)
- [Clarity 法律条款](https://clarity.microsoft.com/terms)
- [Clarity 隐私政策](https://clarity.microsoft.com/privacy)

## 更新日志

- **v1.0.0** - 初始集成
  - 基础跟踪功能
  - 自定义事件支持
  - 工具函数封装
  - 示例组件
