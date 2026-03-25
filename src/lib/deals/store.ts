import fs from 'fs/promises';
import path from 'path';
import { fetchJsonFileFromGitHub, updateGitHubJsonFile } from '@/lib/github';
import { createId, getDayKey, getVisitorEventKey, nowIso, sanitizeImagePayload } from './helpers';
import { extractDealInfo } from './extract';
import type { ContributorProfileViewModel, ContributorRecord, DealPointsLedgerRecord, DealRecord, DealsDataFile, DealTrackEventRecord, DealTrackEventType, DealViewModel } from './types';

const DEALS_PATH = path.join(process.cwd(), 'src', 'data', 'deals.json');
const DEALS_GITHUB_PATH = 'src/data/deals.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

function isGitHubBackedStore() {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO);
}

async function readLocalStore() {
  const raw = await fs.readFile(DEALS_PATH, 'utf-8');
  return JSON.parse(raw) as DealsDataFile;
}

async function writeLocalStore(data: DealsDataFile) {
  await fs.writeFile(DEALS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function readStore(): Promise<{ data: DealsDataFile; sha?: string }> {
  if (isGitHubBackedStore()) {
    const result = await fetchJsonFileFromGitHub<DealsDataFile>(DEALS_GITHUB_PATH);
    return { data: result.content, sha: result.sha };
  }
  return { data: await readLocalStore() };
}

async function writeStore(data: DealsDataFile, message: string, sha?: string) {
  data.meta.updatedAt = nowIso();
  if (isGitHubBackedStore()) {
    if (!sha) throw new Error('missing-deals-sha');
    await updateGitHubJsonFile(DEALS_GITHUB_PATH, sha, data, message);
    return;
  }
  await writeLocalStore(data);
}

function findContributor(data: DealsDataFile, contributorId: string) {
  return data.contributors.find((item) => item.id === contributorId) || null;
}

function buildDealStats(data: DealsDataFile, dealId: string) {
  const events = data.events.filter((item) => item.dealId === dealId);
  const detailViewVisitors = new Set(events.filter((item) => item.eventType === 'view').map((item) => item.visitorId));
  const sourceClickVisitors = new Set(events.filter((item) => item.eventType === 'source_click').map((item) => item.visitorId));
  return {
    detailViews: detailViewVisitors.size,
    sourceClicks: sourceClickVisitors.size,
    helpedUsers: sourceClickVisitors.size || detailViewVisitors.size,
  };
}

function buildDealViewModel(data: DealsDataFile, deal: DealRecord): DealViewModel | null {
  const contributor = findContributor(data, deal.contributorId);
  if (!contributor) return null;
  return { ...deal, contributor, stats: buildDealStats(data, deal.id) };
}

export async function listApprovedDeals() {
  const { data } = await readStore();
  return data.deals.filter((item) => item.moderationDecision === 'approved').map((item) => buildDealViewModel(data, item)).filter(Boolean) as DealViewModel[];
}

export async function getDealById(dealId: string) {
  const { data } = await readStore();
  const deal = data.deals.find((item) => item.id === dealId);
  return deal ? buildDealViewModel(data, deal) : null;
}

export async function bindContributor(input: { contributorId?: string; nickname: string; avatarUrl?: string; bio?: string; openid?: string; unionid?: string }) {
  const { data, sha } = await readStore();
  const timestamp = nowIso();
  const normalizedNickname = input.nickname.trim().slice(0, 24) || '匿名贡献者';
  const normalizedAvatarUrl = sanitizeImagePayload(input.avatarUrl || '') || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(normalizedNickname)}`;
  const match = data.contributors.find((item) => (input.openid && item.openid === input.openid) || (input.contributorId && item.id === input.contributorId));

  if (match) {
    match.nickname = normalizedNickname;
    match.avatarUrl = normalizedAvatarUrl;
    match.bio = input.bio?.trim() || match.bio;
    match.openid = input.openid || match.openid;
    match.unionid = input.unionid || match.unionid;
    match.updatedAt = timestamp;
    await writeStore(data, `feat(deals): update contributor ${match.id}`, sha);
    return match;
  }

  const contributor: ContributorRecord = {
    id: input.contributorId?.trim() || createId('contributor'),
    nickname: normalizedNickname,
    avatarUrl: normalizedAvatarUrl,
    bio: input.bio?.trim() || '',
    openid: input.openid?.trim() || null,
    unionid: input.unionid?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  data.contributors.push(contributor);
  await writeStore(data, `feat(deals): add contributor ${contributor.id}`, sha);
  return contributor;
}

function countDailySubmissions(data: DealsDataFile, contributorId: string, dayKey: string) {
  return data.deals.filter((item) => item.contributorId === contributorId && getDayKey(item.createdAt) === dayKey).length;
}

function appendPoints(data: DealsDataFile, record: DealPointsLedgerRecord) {
  data.pointsLedger.push(record);
}

export async function extractDealPreview(input: { rawText: string; rawImages?: string[]; supplementUrl?: string }) {
  const sanitizedImages = (input.rawImages || []).map(sanitizeImagePayload).filter(Boolean).slice(0, 3);
  return extractDealInfo({ rawText: input.rawText, rawImages: sanitizedImages, supplementUrl: input.supplementUrl });
}

export async function submitDeal(input: { contributorId: string; rawText: string; rawImages?: string[]; supplementUrl?: string }) {
  const { data, sha } = await readStore();
  const contributor = findContributor(data, input.contributorId);
  if (!contributor) throw new Error('contributor-not-found');
  const now = nowIso();
  if (countDailySubmissions(data, contributor.id, getDayKey(now)) >= 10) throw new Error('daily-submit-limit-exceeded');

  const sanitizedImages = (input.rawImages || []).map(sanitizeImagePayload).filter(Boolean).slice(0, 3);
  const extraction = extractDealInfo({ rawText: input.rawText, rawImages: sanitizedImages, supplementUrl: input.supplementUrl });
  const deal: DealRecord = {
    id: createId('deal'), contributorId: contributor.id, title: extraction.title, sourceName: extraction.sourceName, sourceUrl: extraction.sourceUrl,
    priceInfo: extraction.priceInfo, benefitInfo: extraction.benefitInfo, methodText: extraction.methodText, inviteCode: extraction.inviteCode,
    screenshots: sanitizedImages, rawText: input.rawText.trim(), rawImages: sanitizedImages, extractedUrls: extraction.extractedUrls,
    expiresText: extraction.expiresText, riskTags: extraction.riskTags, confidenceScore: extraction.confidenceScore,
    moderationDecision: extraction.moderationDecision, moderationReason: extraction.moderationReason, createdAt: now, updatedAt: now,
  };
  data.deals.push(deal);
  appendPoints(data, { id: createId('points'), contributorId: contributor.id, dealId: deal.id, points: deal.moderationDecision === 'approved' ? 5 : -5, reason: deal.moderationDecision === 'approved' ? '投稿自动通过' : '投稿被自动拒绝', createdAt: now });
  await writeStore(data, `feat(deals): submit ${deal.id}`, sha);
  return buildDealViewModel(data, deal);
}

export async function trackDealEvent(input: { dealId: string; visitorId: string; eventType: DealTrackEventType }) {
  const { data, sha } = await readStore();
  const deal = data.deals.find((item) => item.id === input.dealId);
  if (!deal) throw new Error('deal-not-found');
  const eventKey = getVisitorEventKey(input.dealId, input.visitorId, input.eventType);
  const exists = data.events.some((item) => getVisitorEventKey(item.dealId, item.visitorId, item.eventType) === eventKey);
  if (!exists) {
    data.events.push({ id: createId('event'), dealId: input.dealId, contributorId: deal.contributorId, visitorId: input.visitorId, eventType: input.eventType, createdAt: nowIso() } as DealTrackEventRecord);
    const stats = buildDealStats(data, input.dealId);
    if (input.eventType === 'source_click' && stats.sourceClicks > 0 && stats.sourceClicks % 5 === 0) {
      appendPoints(data, { id: createId('points'), contributorId: deal.contributorId, dealId: input.dealId, points: 2, reason: `来源点击达成 ${stats.sourceClicks}`, createdAt: nowIso() });
    }
    await writeStore(data, `feat(deals): track ${input.eventType} ${input.dealId}`, sha);
  }
  return buildDealStats(data, input.dealId);
}

export async function getContributorProfile(contributorId: string): Promise<ContributorProfileViewModel | null> {
  const { data } = await readStore();
  const contributor = findContributor(data, contributorId);
  if (!contributor) return null;
  const deals = data.deals.filter((item) => item.contributorId === contributor.id).map((item) => buildDealViewModel(data, item)).filter(Boolean) as DealViewModel[];
  const totalPoints = data.pointsLedger.filter((item) => item.contributorId === contributor.id).reduce((sum, item) => sum + item.points, 0);
  return {
    contributor,
    stats: {
      approvedDeals: deals.filter((item) => item.moderationDecision === 'approved').length,
      rejectedDeals: deals.filter((item) => item.moderationDecision === 'rejected').length,
      totalPoints,
      totalDetailViews: deals.reduce((sum, item) => sum + item.stats.detailViews, 0),
      totalSourceClicks: deals.reduce((sum, item) => sum + item.stats.sourceClicks, 0),
      totalHelpedUsers: deals.reduce((sum, item) => sum + item.stats.helpedUsers, 0),
    },
    deals: deals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
