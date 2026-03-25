export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDayKey(value: string) {
  return value.slice(0, 10);
}

export function getVisitorEventKey(dealId: string, visitorId: string, eventType: string) {
  return `${dealId}:${visitorId}:${eventType}`;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function sanitizeImagePayload(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return '';
}

export function extractUrls(input: string) {
  const matches = input.match(/https?:\/\/[^\s)]+/g) || [];
  return Array.from(new Set(matches.map((item) => item.trim())));
}

export function hostnameLabel(url: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function firstMeaningfulLine(input: string) {
  const line = input
    .split(/\n+/)
    .map((item) => item.trim())
    .find((item) => item.length > 0);
  return line || '';
}
