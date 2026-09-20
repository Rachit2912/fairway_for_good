import { describe, it, expect } from 'vitest';
import { calculateMultisetMatches, calculateDrawFinancials, DrawFinancialAllocationInput } from './drawEngine';

describe('Draw Engine Domain Logic', () => {
  it('calculates multiset matches correctly based on example brief', () => {
    const entry = [10, 10, 20, 30, 40];
    const draw = [10, 20, 20, 30, 45];
    expect(calculateMultisetMatches(entry, draw)).toBe(3);
  });

  it('handles identical multisets yielding 5 matches', () => {
    const entry = [10, 15, 20, 25, 30];
    const draw = [10, 15, 20, 25, 30];
    expect(calculateMultisetMatches(entry, draw)).toBe(5);
  });

  it('handles duplicate matches in identical multisets yielding 5 matches', () => {
    const entry = [10, 10, 20, 20, 30];
    const draw = [10, 10, 20, 20, 30];
    expect(calculateMultisetMatches(entry, draw)).toBe(5);
  });

  it('allocates prize pool (40%/35%/25%) without losing a single minor unit', () => {
    const input: DrawFinancialAllocationInput = {
      totalFundedMinor: 500000,
      incomingRolloverMinor: 12000,
      winnerCounts: { fiveMatch: 0, fourMatch: 3, threeMatch: 7 },
    };

    const res = calculateDrawFinancials(input);
    expect(res.basePrizePoolMinor).toBe(100000);
    expect(res.fiveMatchPoolMinor).toBe(52000);
    expect(res.fourMatchPoolMinor).toBe(35000);
    expect(res.threeMatchPoolMinor).toBe(25000);

    expect(res.fourMatchPayoutPerWinnerMinor).toBe(Math.floor(35000 / 3));
    expect(res.threeMatchPayoutPerWinnerMinor).toBe(Math.floor(25000 / 7));
    expect(res.fiveMatchRolloverMinor).toBe(52000);
  });

  it('enforces prize pool conservation regression test with zero winners', () => {
    const input: DrawFinancialAllocationInput = {
      totalFundedMinor: 50000,
      incomingRolloverMinor: 0,
      winnerCounts: { fiveMatch: 0, fourMatch: 0, threeMatch: 0 },
    };

    const res = calculateDrawFinancials(input);
    expect(res.basePrizePoolMinor).toBe(10000);
    expect(res.fiveMatchRolloverMinor).toBe(4000);
    expect(res.unawardedReserveMinor).toBe(6000);
    expect(res.roundingReserveMinor).toBe(0);
  });
});
