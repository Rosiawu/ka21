# Vercel 配置备份

## 域名重定向配置（当前已禁用）

当前 `vercel.json` 为空配置，用于测试环境。

### 原重定向配置
当需要启用域名跳转时，将以下配置添加到 `vercel.json`：

```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "host",
          "value": "ka21.voidcool.top"
        }
      ],
      "destination": "https://www.ka21ai.cn/$1",
      "permanent": true
    }
  ]
}
```

### 配置说明
- **source**: `"/(.*)"` - 匹配所有路径
- **has.type**: `"host"` - 基于主机名的条件匹配
- **has.value**: `"ka21.voidcool.top"` - 来源域名
- **destination**: `"https://www.ka21ai.cn/$1"` - 目标域名，$1保持原路径
- **permanent**: `true` - 301永久重定向

### 使用方式
1. **测试阶段**：保持 `vercel.json` 为空配置 `{}`
2. **生产部署**：将上述配置复制到 `vercel.json` 启用重定向
3. **禁用重定向**：清空 `vercel.json` 内容为 `{}`

### 重定向效果
启用后：
- `ka21.voidcool.top` → `www.ka21ai.cn`
- `ka21.voidcool.top/tools` → `www.ka21ai.cn/tools`
- `ka21.voidcool.top/search?q=ai` → `www.ka21ai.cn/search?q=ai`
