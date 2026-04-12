#!/usr/bin/env tsx
/**
 * feishu:check-auth
 * 验证飞书应用凭证是否有效，并检查已配置的多维表是否可访问。
 * 用法: npm run feishu:check-auth
 */
import { loadEnvLocal } from './lib/load-env.js';
import { schemaExists, loadSchema } from './lib/schema.js';

loadEnvLocal();

async function main() {
  const appId = process.env.FEISHU_APP_ID?.trim();
  const appSecret = process.env.FEISHU_APP_SECRET?.trim();

  console.log('═══════════════════════════════════════════');
  console.log('   飞书认证状态检查');
  console.log('═══════════════════════════════════════════');

  // ── 1. 检查环境变量 ─────────────────────────────────────────────────────────
  if (!appId || !appSecret) {
    console.error('❌ 缺少 FEISHU_APP_ID 或 FEISHU_APP_SECRET');
    console.error('   请在 .env.local 中添加（参考 .env.example）：');
    console.error('   FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx');
    console.error('   FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  console.log(`\n📋 App ID  : ${appId}`);
  console.log(`   App Secret: ${'*'.repeat(Math.max(0, appSecret.length - 4))}${appSecret.slice(-4)}`);

  // ── 2. 获取 tenant_access_token（验证凭证） ─────────────────────────────────
  console.log('\n🔐 正在验证应用凭证（获取 tenant_access_token）...');
  const tokenResp = await fetch(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    },
  );
  const tokenData = (await tokenResp.json()) as {
    code: number;
    msg: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (tokenData.code !== 0) {
    console.error(`\n❌ 认证失败 (code=${tokenData.code}): ${tokenData.msg}`);
    console.error('   可能原因：');
    console.error('   • FEISHU_APP_ID 或 FEISHU_APP_SECRET 填写错误');
    console.error('   • 应用未发布（需在飞书开发者后台"版本管理"发布内部测试版）');
    process.exit(1);
  }

  console.log(`✅ 凭证有效，token 有效期 ${tokenData.expire} 秒`);
  const token = tokenData.tenant_access_token!;

  // ── 3. 检查多维表 ────────────────────────────────────────────────────────────
  if (schemaExists()) {
    const schema = loadSchema();
    console.log(`\n📊 已找到 schema.json，检查多维表...`);
    console.log(`   app_token: ${schema.app_token}`);

    const baseResp = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${schema.app_token}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const baseData = (await baseResp.json()) as {
      code: number;
      msg: string;
      data?: { app?: { name: string } };
    };

    if (baseData.code === 0) {
      console.log(`✅ 多维表可访问：${baseData.data?.app?.name}`);
      console.log(`\n   tables:`);
      for (const [name, tableId] of Object.entries(schema.tables)) {
        console.log(`     ${name}: ${tableId}`);
      }
    } else {
      console.error(`❌ 无法访问多维表 (code=${baseData.code}): ${baseData.msg}`);
      console.error('   请重新运行: npm run feishu:podcast:ensure-base');
    }
  } else {
    console.log('\n⚠️  schema.json 不存在，多维表尚未创建。');
    console.log('   请运行: npm run feishu:podcast:ensure-base');
  }

  console.log('\n═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
