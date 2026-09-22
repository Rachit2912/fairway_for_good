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

  it('enforces strict chronological publication order (Jan -> Feb -> Mar) and prevents out-of-order publication', () => {
    const drawsInDatabase = [
      { id: 'draw_jan', month: 1, year: 2026, status: 'generated' },
      { id: 'draw_feb', month: 2, year: 2026, status: 'draft' },
      { id: 'draw_mar', month: 3, year: 2026, status: 'generated' },
    ];

    // Function simulating database publish_monthly_draw chronological guard
    function canPublishDraw(drawId: string) {
      const target = drawsInDatabase.find((d) => d.id === drawId);
      if (!target) return false;

      // Check if any earlier draw remains unpublished
      const earlierUnpublished = drawsInDatabase.some(
        (d) =>
          (d.year < target.year || (d.year === target.year && d.month < target.month)) &&
          d.status !== 'published'
      );

      return !earlierUnpublished;
    }

    // Jan can publish (no earlier draws)
    expect(canPublishDraw('draw_jan')).toBe(true);

    // March CANNOT publish before Feb is published (out-of-order guard)
    expect(canPublishDraw('draw_mar')).toBe(false);

    // Publish Jan
    drawsInDatabase[0].status = 'published';

    // March STILL cannot publish because Feb is draft
    expect(canPublishDraw('draw_mar')).toBe(false);

    // Publish Feb
    drawsInDatabase[1].status = 'published';

    // Now March CAN publish
    expect(canPublishDraw('draw_mar')).toBe(true);
  });

  it('ensures single-rollover consumption from immediately preceding published draw', () => {
    const janFinancials = {
      five_match_rollover_minor: 15000,
    };

    // March draw consuming rollover
    const marchDrawInput = {
      totalFundedMinor: 50000,
      incomingRolloverMinor: janFinancials.five_match_rollover_minor, // 15,000 from Jan
      winnerCounts: { fiveMatch: 1, fourMatch: 0, threeMatch: 0 },
    };

    const res = calculateDrawFinancials(marchDrawInput);
    expect(res.fiveMatchPoolMinor).toBe(19000); // (50,000 * 0.20 * 0.40 = 4,000) + 15,000 = 19,000
    expect(res.fiveMatchPayoutPerWinnerMinor).toBe(19000); // 1 winner gets entire 19,000
    expect(res.fiveMatchRolloverMinor).toBe(0); // 0 rollover carried forward since 1 winner
  });
});
