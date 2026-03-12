import eventSubmissions from '@/data/event-submissions.json';

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

function getSortTime(entry: EventEntry) {
  return new Date(entry.eventDate || entry.createdAt).getTime();
}

export const sortedEvents = [...submissionEntries, ...staticEvents].sort((a, b) => getSortTime(b) - getSortTime(a));

export function getEventPreviewSnippet(summary: string) {
  return summary.replace(/\s+/g, ' ').trim().slice(0, 96);
}
