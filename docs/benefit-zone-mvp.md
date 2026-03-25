# 羊毛区 MVP 说明

这份代码直接把产品意图落在仓库里，供后续代理或开发者快速识别：

- 目标：让社区成员提交羊毛/优惠/邀请码/额度赠送信息
- 入口：网页投稿优先，小程序扫码绑定是下一步
- 内容形态：文本、图片证据、可选补充链接
- 系统行为：自动抽取 `标题 / 来源链接 / 价格 / 福利 / 薅法 / 邀请码 / 失效时间`
- 审核策略：保守放行，不确定默认拒绝
- 贡献者体系：头像、昵称、个人页、积分、帮助人数
- 限流：每个 contributor 每天 10 条投稿

## 当前代码位置

- 数据模型：`src/lib/deals/types.ts`
- 抽取逻辑：`src/lib/deals/extract.ts`
- 存储与积分：`src/lib/deals/store.ts`
- API：`src/app/api/deals/*`
- 页面：`src/app/[locale]/deals/*`
- 组件：`src/components/deals/*`
- 数据文件：`src/data/deals.json`

## 后续明确待办

- 接入小程序 `wx.login + code2Session`
- 接入网页扫码绑定会话
- OCR/多模态图片理解
- 反垃圾与风控升级
- 从 JSON 文件迁移到数据库
