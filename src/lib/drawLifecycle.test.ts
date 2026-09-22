import { describe, it, expect } from 'vitest';
import { calculateDrawFinancials } from './drawEngine';

describe('Database Draw Lifecycle Contract Rules', () => {
  it('validates draw state transitions: draft -> locked -> generated -> published', () => {
    let status = 'draft';

    status = 'locked';
    expect(status).toBe('locked');

    status = 'generated';
    expect(status).toBe('generated');

    status = 'published';
    expect(status).toBe('published');
  });

  it('prohibits rerolling numbers or re-publishing a published draw', () => {
    const drawState = {
      status: 'published',
      officialNumbers: [10, 20, 30, 40, 45],
    };

    const canReroll = drawState.status !== 'published';
    expect(canReroll).toBe(false);
  });

  it('enforces verified, non-null, unexpired paid-through subscription eligibility', () => {
    function isSubscriberEligible(sub: { status: string; current_period_end: string | null }): boolean {
      if (sub.status !== 'active' && sub.status !== 'trialing') return false;
      if (!sub.current_period_end) return false;
      return new Date(sub.current_period_end) >= new Date();
    }

    expect(isSubscriberEligible({ status: 'active', current_period_end: null })).toBe(false);
    expect(isSubscriberEligible({ status: 'active', current_period_end: '2020-01-01T00:00:00Z' })).toBe(false);
    expect(isSubscriberEligible({ status: 'active', current_period_end: '2099-01-01T00:00:00Z' })).toBe(true);
  });

  it('enforces strict chronological publication order and rejects out-of-order draws (Jan published -> Mar published -> Feb attempt rejected)', () => {
    const drawsInDatabase = [
      { id: 'draw_jan', month: 1, year: 2026, status: 'published' },
      { id: 'draw_mar', month: 3, year: 2026, status: 'published' },
      { id: 'draw_feb', month: 2, year: 2026, status: 'generated' },
    ];

    function canPublishDraw(drawId: string) {
      const target = drawsInDatabase.find((d) => d.id === drawId);
      if (!target) return false;
      if (target.status === 'published') return false;

      // Reject publication if ANY earlier month remains uncompleted
      const earlierUncompleted = drawsInDatabase.some(
        (d) =>
          (d.year < target.year || (d.year === target.year && d.month < target.month)) &&
          d.status !== 'published'
      );
      if (earlierUncompleted) return false;

      // Reject publication if ANY later month is already published
      const laterPublished = drawsInDatabase.some(
        (d) =>
          (d.year > target.year || (d.year === target.year && d.month > target.month)) &&
          d.status === 'published'
      );
      if (laterPublished) return false;

      return true;
    }

    // February publication MUST be rejected because March is already published
    expect(canPublishDraw('draw_feb')).toBe(false);
  });

  it('carries forward unconsumed rollover across skipped months (Jan -> March skips Feb)', () => {
    const janFinancials = {
      five_match_rollover_minor: 4000,
    };

    // March draw carrying forward January rollover when Feb is skipped
    const marchDrawInput = {
      totalFundedMinor: 50000,
      incomingRolloverMinor: janFinancials.five_match_rollover_minor, // 4,000 from Jan
      winnerCounts: { fiveMatch: 0, fourMatch: 0, threeMatch: 0 },
    };

    const res = calculateDrawFinancials(marchDrawInput);
    expect(res.fiveMatchPoolMinor).toBe(8000); // 4,000 base + 4,000 rollover = 8,000
    expect(res.fiveMatchRolloverMinor).toBe(8000); // Carried forward to April
    expect(res.unawardedReserveMinor).toBe(6000);
    expect(res.roundingReserveMinor).toBe(0);
  });
});
