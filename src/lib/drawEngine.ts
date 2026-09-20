export function calculateMultisetMatches(entryScores: number[], drawNumbers: number[]): number {
  const entryCounts = new Map<number, number>();
  const drawCounts = new Map<number, number>();

  for (const num of entryScores) {
    entryCounts.set(num, (entryCounts.get(num) || 0) + 1);
  }

  for (const num of drawNumbers) {
    drawCounts.set(num, (drawCounts.get(num) || 0) + 1);
  }

  let totalMatches = 0;
  for (const [val, eCount] of entryCounts.entries()) {
    const dCount = drawCounts.get(val) || 0;
    totalMatches += Math.min(eCount, dCount);
  }

  return totalMatches;
}

export interface DrawFinancialAllocationInput {
  totalFundedMinor: number;
  incomingRolloverMinor: number;
  winnerCounts: {
    fiveMatch: number;
    fourMatch: number;
    threeMatch: number;
  };
}

export function calculateDrawFinancials(input: DrawFinancialAllocationInput) {
  const P = Math.floor(input.totalFundedMinor * 0.20);

  const t5Base = Math.floor(P * 0.40);
  const t4Base = Math.floor(P * 0.35);
  const t3Base = P - t5Base - t4Base;

  const t5Pool = t5Base + input.incomingRolloverMinor;
  const t4Pool = t4Base;
  const t3Pool = t3Base;

  let t5PayoutPerWinner = 0;
  let t5Rollover = 0;
  let t5Reserve = 0;

  if (input.winnerCounts.fiveMatch > 0) {
    t5PayoutPerWinner = Math.floor(t5Pool / input.winnerCounts.fiveMatch);
    t5Reserve = t5Pool - t5PayoutPerWinner * input.winnerCounts.fiveMatch;
  } else {
    t5Rollover = t5Pool;
  }

  let t4PayoutPerWinner = 0;
  let t4Reserve = 0;

  if (input.winnerCounts.fourMatch > 0) {
    t4PayoutPerWinner = Math.floor(t4Pool / input.winnerCounts.fourMatch);
    t4Reserve = t4Pool - t4PayoutPerWinner * input.winnerCounts.fourMatch;
  } else {
    t4Reserve = t4Pool;
  }

  let t3PayoutPerWinner = 0;
  let t3Reserve = 0;

  if (input.winnerCounts.threeMatch > 0) {
    t3PayoutPerWinner = Math.floor(t3Pool / input.winnerCounts.threeMatch);
    t3Reserve = t3Pool - t3PayoutPerWinner * input.winnerCounts.threeMatch;
  } else {
    t3Reserve = t3Pool;
  }

  return {
    basePrizePoolMinor: P,
    fiveMatchPoolMinor: t5Pool,
    fourMatchPoolMinor: t4Pool,
    threeMatchPoolMinor: t3Pool,
    fiveMatchPayoutPerWinnerMinor: t5PayoutPerWinner,
    fourMatchPayoutPerWinnerMinor: t4PayoutPerWinner,
    threeMatchPayoutPerWinnerMinor: t3PayoutPerWinner,
    fiveMatchRolloverMinor: t5Rollover,
    unawardedReserveMinor:
      (input.winnerCounts.fourMatch === 0 ? t4Pool : 0) + (input.winnerCounts.threeMatch === 0 ? t3Pool : 0),
    roundingReserveMinor: t5Reserve + t4Reserve + t3Reserve,
  };
}
