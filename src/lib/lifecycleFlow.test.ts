import { describe, it, expect } from 'vitest';
import { calculateMultisetMatches, calculateDrawFinancials } from './drawEngine';
import { validateAndFormatScore, retainFiveGreatestScores } from './scores';
import { approveWinnerProof, processPayout, WinnerWorkflowState } from './winnerWorkflow';

describe('End-to-End Application Lifecycle Integration Flow', () => {
  it('simulates complete user flow: scores -> draw lock -> generation -> proof -> payout', () => {
    // 1. Score Entry & 5-Greatest Retention
    let userScores: { round_date: string; value: number }[] = [];

    const inputs = [
      { round_date: '2026-03-01', value: 20 },
      { round_date: '2026-03-02', value: 25 },
      { round_date: '2026-03-03', value: 30 },
      { round_date: '2026-03-04', value: 35 },
      { round_date: '2026-03-05', value: 40 },
    ];

    for (const score of inputs) {
      const formatted = validateAndFormatScore(score.value, score.round_date);
      userScores = retainFiveGreatestScores(userScores, formatted);
    }

    expect(userScores).toHaveLength(5);
    expect(userScores[0].round_date).toBe('2026-03-05');

    // 2. Draw Multiset Matching
    const entryValues = userScores.map((s) => s.value);
    const officialDrawNumbers = [40, 35, 30, 15, 10];

    const matches = calculateMultisetMatches(entryValues, officialDrawNumbers);
    expect(matches).toBe(3);

    // 3. Draw Financial Allocation
    const financials = calculateDrawFinancials({
      totalFundedMinor: 1000000,
      incomingRolloverMinor: 5000,
      winnerCounts: { fiveMatch: 0, fourMatch: 0, threeMatch: 1 },
    });

    expect(financials.basePrizePoolMinor).toBe(200000);
    expect(financials.threeMatchPayoutPerWinnerMinor).toBe(financials.threeMatchPoolMinor);

    // 4. Winner Proof Review & Payout Lifecycle
    let winnerState: WinnerWorkflowState = {
      awardId: 'award_march_2026_usr1',
      storagePath: 'winner_proofs/award_march_2026_usr1_scorecard.png',
      reviewStatus: 'pending',
      payoutStatus: 'pending',
    };

    expect(() => processPayout(winnerState, 'admin_id')).toThrow();

    winnerState = approveWinnerProof(winnerState, 'admin_id');
    expect(winnerState.reviewStatus).toBe('approved');

    winnerState = processPayout(winnerState, 'admin_id');
    expect(winnerState.payoutStatus).toBe('paid');
  });
});
