# KA21 微信小程序

这个目录是从当前网站内容迁移出的微信小程序版本，包含：

- 首页（数据总览、热门工具、最新教程）
- 工具库（搜索 + 分类筛选）
- 工具详情（指南、相关文章、群友点评）
- 教程页（关键词 + 分类 + 难度筛选）
- 关于页（团队成员信息）
- 内嵌 WebView（打开官网与教程原文）

## 1. 同步网站数据到小程序

在仓库根目录执行：

```bash
npm run export:miniapp-data
```

会把网站内容导出到：

- `miniprogram/data/tools.json`
- `miniprogram/data/tutorials.json`
- `miniprogram/data/categories.json`
- `miniprogram/data/team-members.json`

图片等静态资源默认使用线上地址 `https://ka21.tools`，避免小程序包体超过 2MB 限制。

## 2. 在微信开发者工具运行

1. 打开微信开发者工具
2. 选择导入项目，目录选 `miniprogram`
3. 使用你自己的小程序 `AppID`（当前是 `touristappid` 占位）
4. 编译运行

## 3. 重要配置说明

- 小程序里教程和官网通过 `web-view` 打开，目标域名必须在微信小程序后台的业务域名白名单中配置。
- 如果你要改资源域名，可在导出时指定：

```bash
MINIAPP_ASSET_BASE_URL=https://your-domain.com npm run export:miniapp-data
```
