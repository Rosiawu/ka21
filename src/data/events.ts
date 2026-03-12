import eventSubmissions from '@/data/event-submissions.json';
import { fetchJsonFileFromGitHub } from '@/lib/github';

export type EventEntry = {
  id: string;
  title: string;
  summary: string;
  organizer?: string;
  author?: string;
  sourceUrl: string;
  sourceLabel?: string;
  eventDate?: string;
  deadline?: string;
  location?: string;
  tags?: string[];
  coverImage?: string;
  images?: string[];
  createdAt: string;
};

type EventSubmissionFile = {
  entries: EventEntry[];
  meta: {
    version: string;
    updatedAt: string;
    count: number;
  };
};

const staticEvents: EventEntry[] = [];

const submissionEntries = (eventSubmissions as EventSubmissionFile).entries || [];
const GITHUB_EVENTS_PATH = 'src/data/event-submissions.json';

function getSortTime(entry: EventEntry) {
  return new Date(entry.eventDate || entry.createdAt).getTime();
}

export const sortedEvents = [...submissionEntries, ...staticEvents].sort((a, b) => getSortTime(b) - getSortTime(a));

export async function getSortedEvents() {
  try {
    const remote = await fetchJsonFileFromGitHub<EventSubmissionFile>(GITHUB_EVENTS_PATH);
    const remoteEntries = remote.content.entries || [];
    return [...remoteEntries, ...staticEvents].sort((a, b) => getSortTime(b) - getSortTime(a));
  } catch {
    return sortedEvents;
  }
}

export function getEventPreviewSnippet(summary: string) {
  return summary.replace(/\s+/g, ' ').trim().slice(0, 96);
}
