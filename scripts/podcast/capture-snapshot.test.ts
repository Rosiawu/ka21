import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertSnapshotHistoryPreserved,
  buildHistoricalBaseline,
  stabilizeSnapshotWithPrevious,
  type Snapshot,
} from './capture-snapshot';

function snapshot(date: string, platformTotals: Record<string, number>, episodePlays: Snapshot['episodePlays']): Snapshot {
  return {
    id: `snapshot-${date}`,
    date,
    note: '自动抓取',
    platformTotals,
    episodePlays,
    createdAt: `${date}T02:10:00.000Z`,
  };
}

test('keeps fresh platforms and carries forward only the failed platform', () => {
  const previous = snapshot(
    '2026-11-08',
    { xiaoyuzhou: 100, lizhi: 200 },
    { episode1: { xiaoyuzhou: 40, lizhi: 80 } },
  );
  const current = snapshot('2026-11-09', { xiaoyuzhou: 110 }, { episode1: { xiaoyuzhou: 45 } });

  const result = stabilizeSnapshotWithPrevious(current, previous);

  assert.deepEqual(result.fallbackPlatforms, ['lizhi']);
  assert.equal(current.platformTotals.xiaoyuzhou, 110);
  assert.equal(current.platformTotals.lizhi, 200);
  assert.equal(current.episodePlays.episode1.xiaoyuzhou, 45);
  assert.equal(current.episodePlays.episode1.lizhi, 80);
});

test('stabilizes a missing episode value without replacing a healthy platform total', () => {
  const previous = snapshot('2026-11-08', { xiaoyuzhou: 100 }, { episode1: { xiaoyuzhou: 40 } });
  const current = snapshot('2026-11-09', { xiaoyuzhou: 110 }, {});

  const result = stabilizeSnapshotWithPrevious(current, previous);

  assert.deepEqual(result.fallbackPlatforms, []);
  assert.equal(current.episodePlays.episode1.xiaoyuzhou, 40);
});

test('keeps the latest known episode value even when a platform has no aggregate total', () => {
  const previous = snapshot('2026-11-08', {}, { episode1: { youtube: 12 } });
  const current = snapshot('2026-11-09', {}, { episode1: { youtube: 10 } });

  stabilizeSnapshotWithPrevious(current, previous);

  assert.equal(current.episodePlays.episode1.youtube, 12);
});

test('uses the latest known value per platform even if the immediately previous day missed it', () => {
  const older = snapshot('2026-11-07', { xiaoyuzhou: 90, youtube: 12 }, { episode1: { youtube: 7 } });
  const previousDay = snapshot('2026-11-08', { xiaoyuzhou: 100 }, { episode1: { xiaoyuzhou: 40 } });

  const baseline = buildHistoricalBaseline([older, previousDay], '2026-11-09');

  assert.equal(baseline?.date, '2026-11-08');
  assert.equal(baseline?.platformTotals.xiaoyuzhou, 100);
  assert.equal(baseline?.platformTotals.youtube, 12);
  assert.equal(baseline?.episodePlays.episode1.youtube, 7);
});

test('rejects a merge that removes an earlier date', () => {
  const before = [snapshot('2026-11-07', { lizhi: 10 }, {}), snapshot('2026-11-08', { lizhi: 20 }, {})];
  const after = [snapshot('2026-11-09', { lizhi: 30 }, {})];

  assert.throws(
    () => assertSnapshotHistoryPreserved(before, after, '2026-11-09'),
    /would lose 2 date\(s\)/,
  );
});

test('allows an idempotent same-day replacement while preserving history', () => {
  const before = [snapshot('2026-11-08', { lizhi: 20 }, {}), snapshot('2026-11-09', { lizhi: 25 }, {})];
  const after = [snapshot('2026-11-08', { lizhi: 20 }, {}), snapshot('2026-11-09', { lizhi: 30 }, {})];

  assert.doesNotThrow(() => assertSnapshotHistoryPreserved(before, after, '2026-11-09'));
});
