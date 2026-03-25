export type DealModerationDecision = 'approved' | 'rejected';
export type DealTrackEventType = 'view' | 'source_click';

export interface ContributorRecord {
  id: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  openid: string | null;
  unionid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealRecord {
  id: string;
  contributorId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  priceInfo: string;
  benefitInfo: string;
  methodText: string;
  inviteCode: string;
  screenshots: string[];
  rawText: string;
  rawImages: string[];
  extractedUrls: string[];
  expiresText: string;
  riskTags: string[];
  confidenceScore: number;
  moderationDecision: DealModerationDecision;
  moderationReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealTrackEventRecord {
  id: string;
  dealId: string;
  contributorId: string;
  visitorId: string;
  eventType: DealTrackEventType;
  createdAt: string;
}

export interface DealPointsLedgerRecord {
  id: string;
  contributorId: string;
  dealId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface DealsDataFile {
  contributors: ContributorRecord[];
  deals: DealRecord[];
  events: DealTrackEventRecord[];
  pointsLedger: DealPointsLedgerRecord[];
  meta: {
    version: string;
    updatedAt: string;
  };
}

export interface DealExtractionResult {
  title: string;
  sourceName: string;
  sourceUrl: string;
  priceInfo: string;
  benefitInfo: string;
  methodText: string;
  inviteCode: string;
  expiresText: string;
  extractedUrls: string[];
  riskTags: string[];
  confidenceScore: number;
  moderationDecision: DealModerationDecision;
  moderationReason: string;
}

export interface DealStats {
  detailViews: number;
  sourceClicks: number;
  helpedUsers: number;
}

export interface DealViewModel extends DealRecord {
  contributor: ContributorRecord;
  stats: DealStats;
}

export interface ContributorProfileViewModel {
  contributor: ContributorRecord;
  stats: {
    approvedDeals: number;
    rejectedDeals: number;
    totalPoints: number;
    totalDetailViews: number;
    totalSourceClicks: number;
    totalHelpedUsers: number;
  };
  deals: DealViewModel[];
}
