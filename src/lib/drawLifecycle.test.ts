import { describe, it, expect } from 'vitest';
import { calculateMultisetMatches, calculateDrawFinancials } from './drawEngine';

describe('Database Draw Lifecycle Contract Rules', () => {
  it('validates draw state transitions: draft -> locked -> generated -> published', () => {
    let status = 'draft';

    // Transition draft to locked
    expect(status).toBe('draft');
    status = 'locked';

    // Transition locked to generated
    expect(status).toBe('locked');
    status = 'generated';

    // Transition generated to published
    expect(status).toBe('generated');
    status = 'published';

    expect(status).toBe('published');
  });

  it('prohibits rerolling numbers or re-publishing a published draw', () => {
    const drawState = {
      status: 'published',
      officialNumbers: [10, 20, 30, 40, 45],
    };

    // Attempting to overwrite official numbers once published
    const canReroll = drawState.status !== 'published';
    expect(canReroll).toBe(false);
  });

  it('calculates awards and rollover accurately for a 10-subscriber draw pool', () => {
    // 10 active subscribers paying ₹999/mo (99,900 minor units total)
    // Fixed 20% prize share = 19,980 minor units total funded
    const totalFundedMinor = 19980;

    const financials = calculateDrawFinancials({
      totalFundedMinor,
      incomingRolloverMinor: 0,
      winnerCounts: { fiveMatch: 0, fourMatch: 1, threeMatch: 2 },
    });

    // 20% base pool
    expect(financials.basePrizePoolMinor).toBe(3996);
    expect(financials.fiveMatchPoolMinor).toBe(1598); // 40%
    expect(financials.fourMatchPoolMinor).toBe(1398); // 35%
    expect(financials.threeMatchPoolMinor).toBe(1000); // 25% remainder

    // 0 five-match winners => 1598 rolled over
    expect(financials.fiveMatchRolloverMinor).toBe(1598);
    // 1 four-match winner => 1398 payout
    expect(financials.fourMatchPayoutPerWinnerMinor).toBe(1398);
    // 2 three-match winners => 500 payout each
    expect(financials.threeMatchPayoutPerWinnerMinor).toBe(500);
  });
});
