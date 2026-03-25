import { clampScore, extractUrls, firstMeaningfulLine, hostnameLabel } from './helpers';
import type { DealExtractionResult } from './types';

function pickInviteCode(text: string) {
  const match = text.match(/(?:邀请码|邀請碼|code|CODE|口令)[:：\s]*([A-Za-z0-9-]{4,24})/);
  return match?.[1] || '';
}

function pickExpiresText(text: string) {
  const match = text.match(/(?:截止|结束|失效|有效期|活动时间|到期)[:：\s]*([^\n。；;]{4,40})/);
  return match?.[1]?.trim() || '';
}

function pickPriceInfo(text: string) {
  const match = text.match(/((?:¥|￥)?\s?\d+(?:\.\d+)?\s?(?:元|块|刀|USD)?|免费|首月免费|半价|折扣价|限时价)/);
  return match?.[1]?.trim() || '';
}

function pickBenefitInfo(text: string) {
  const line = text
    .split(/\n+/)
    .map((item) => item.trim())
    .find((item) => /(优惠|福利|赠送|返现|减免|补贴|立减|折扣|免费)/.test(item));
  return line || '';
}

function pickMethodText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const matched = lines.filter((item) => /(方式|方法|步骤|教程|薅|领取|参与|注册|下单|开通)/.test(item));
  return matched.slice(0, 3).join(' / ') || lines.slice(1, 3).join(' / ');
}

function buildRiskTags(input: { text: string; sourceUrl: string; inviteCode: string; hasImages: boolean }) {
  const tags: string[] = [];
  const textLength = input.text.trim().length;
  if (textLength < 18) tags.push('内容过短');
  if (!input.sourceUrl) tags.push('缺少来源链接');
  if (input.inviteCode && textLength < 40) tags.push('邀请码信息过重');
  if (!/[\u4e00-\u9fa5A-Za-z]/.test(input.text)) tags.push('文本可读性不足');
  if (/(博彩|彩票|代刷|返现盘|杀猪盘|资金盘|贷款|灰产|VPN|翻墙|成人)/i.test(input.text)) tags.push('高风险词');
  if (!input.text.trim() && input.hasImages) tags.push('仅图片投稿');
  return Array.from(new Set(tags));
}

export function extractDealInfo(input: { rawText: string; rawImages?: string[]; supplementUrl?: string }): DealExtractionResult {
  const rawText = String(input.rawText || '').trim();
  const extractedUrls = extractUrls([rawText, input.supplementUrl || ''].filter(Boolean).join('\n'));
  const sourceUrl = input.supplementUrl?.trim() || extractedUrls[0] || '';
  const title = firstMeaningfulLine(rawText).slice(0, 72) || (sourceUrl ? hostnameLabel(sourceUrl) : '未命名羊毛');
  const inviteCode = pickInviteCode(rawText);
  const expiresText = pickExpiresText(rawText);
  const priceInfo = pickPriceInfo(rawText);
  const benefitInfo = pickBenefitInfo(rawText);
  const methodText = pickMethodText(rawText);
  const riskTags = buildRiskTags({ text: rawText, sourceUrl, inviteCode, hasImages: Boolean(input.rawImages?.length) });

  let confidence = 0.2;
  if (rawText.length >= 40) confidence += 0.18;
  if (rawText.length >= 90) confidence += 0.1;
  if (sourceUrl) confidence += 0.22;
  if (benefitInfo) confidence += 0.1;
  if (methodText) confidence += 0.1;
  if (priceInfo) confidence += 0.08;
  if (expiresText) confidence += 0.05;
  if (input.rawImages?.length) confidence += 0.05;
  confidence -= riskTags.length * 0.12;
  confidence = clampScore(confidence);

  const approved = confidence >= 0.62 && !riskTags.includes('高风险词') && !riskTags.includes('仅图片投稿') && !riskTags.includes('邀请码信息过重');

  return {
    title,
    sourceName: hostnameLabel(sourceUrl),
    sourceUrl,
    priceInfo,
    benefitInfo,
    methodText,
    inviteCode,
    expiresText,
    extractedUrls,
    riskTags,
    confidenceScore: confidence,
    moderationDecision: approved ? 'approved' : 'rejected',
    moderationReason: approved ? '信息完整度达到自动通过阈值。' : '按保守策略处理：来源、方法或可信度不足。',
  };
}
