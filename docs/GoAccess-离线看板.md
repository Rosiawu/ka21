# GoAccess 离线看板

你不需要在 KA21 网站里看数据。  
使用下面命令会在本地生成一个可随时打开的报告页面。

## 1) 配置 `.env.local`

```env
GOACCESS_LOG_PATH=/var/log/nginx/access.log,/var/log/nginx/access.log.1
GOACCESS_LOG_FORMAT=COMBINED
GOACCESS_DATE_FORMAT=%d/%b/%Y
GOACCESS_TIME_FORMAT=%T
GOACCESS_BIN=/opt/homebrew/bin/goaccess
```

## 2) 生成报告

默认最近 30 天：

```bash
npm run analytics:report
```

指定天数（例如最近 7 天）：

```bash
npm run analytics:report -- --days=7
```

生成并自动打开：

```bash
npm run analytics:open
```

## 3) 报告位置

- 最新报告：`analytics-reports/latest.html`
- 最新 JSON：`analytics-reports/latest.json`
- 历史报告：`analytics-reports/report-YYYYMMDD-HHMMSS.html`

## 4) 需要通过浏览器访问文件时

```bash
npm run analytics:serve
```

然后打开：`http://localhost:8787/latest.html`

## 5) 没有日志路径时的兜底方案

直接打开统一数据入口（优先打开本地 latest.html；没有本地报告时打开 Clarity 控制台）：

```bash
npm run analytics:panel
```
