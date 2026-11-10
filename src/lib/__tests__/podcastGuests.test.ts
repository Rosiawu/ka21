import episodeData from '@/data/podcast-episodes.json';
import { getGuestProfile, guestProfiles } from '@/lib/podcastGuests';

describe('podcast guest directory', () => {
  it('keeps one independent directory page for every episode', () => {
    expect(guestProfiles).toHaveLength(episodeData.episodes.length);
    expect(new Set(guestProfiles.map((profile) => profile.slug)).size).toBe(guestProfiles.length);
    expect(new Set(guestProfiles.map((profile) => profile.episodeNumber)).size).toBe(episodeData.episodes.length);
  });

  it('keeps repeat guest episodes 58 and 59 as separate pages', () => {
    expect(getGuestProfile('li-shuqi')?.episodeNumber).toBe(59);
    expect(getGuestProfile('li-shuqi-58')?.episodeNumber).toBe(58);
  });
});
