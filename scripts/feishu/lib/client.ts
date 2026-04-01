import * as lark from '@larksuiteoapi/node-sdk';

let _client: lark.Client | null = null;

export function getLarkClient(): lark.Client {
  if (_client) return _client;

  const appId = process.env.FEISHU_APP_ID?.trim();
  const appSecret = process.env.FEISHU_APP_SECRET?.trim();

  if (!appId || !appSecret) {
    throw new Error(
      '❌  缺少飞书凭证。请在 .env.local 中设置：\n' +
        '   FEISHU_APP_ID=cli_xxxxxxxx\n' +
        '   FEISHU_APP_SECRET=xxxxxxxxxxxxx\n' +
        '参见 .env.example 中的说明。',
    );
  }

  _client = new lark.Client({
    appId,
    appSecret,
    appType: lark.AppType.SelfBuild,
    domain: lark.Domain.Feishu,
    loggerLevel: lark.LoggerLevel.warn,
  });

  return _client;
}
