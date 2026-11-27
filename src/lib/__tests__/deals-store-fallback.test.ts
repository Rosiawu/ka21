jest.mock('fs/promises', () => ({
  readFile: jest.fn(async () => {
    throw Object.assign(new Error('ENOENT: deals.json is not on the worker filesystem'), { code: 'ENOENT' });
  }),
  writeFile: jest.fn(),
}));

describe('deals public reads on a filesystem-less runtime', () => {
  test('falls back to bundled deals instead of throwing', async () => {
    process.env.GITHUB_TOKEN = '';
    process.env.GITHUB_REPO = '';
    jest.resetModules();

    const { getContributorProfile, getDealById, listApprovedDeals } = await import('../deals/store');

    await expect(listApprovedDeals()).resolves.toEqual([]);
    await expect(getDealById('missing-deal')).resolves.toBeNull();
    await expect(getContributorProfile('contributor_4jb3zbwc')).resolves.toEqual(
      expect.objectContaining({
        contributor: expect.objectContaining({ nickname: 'Anson' }),
      }),
    );
  });
});
