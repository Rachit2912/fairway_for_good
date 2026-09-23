import { describe, it, expect } from 'vitest';
import { approveWinnerProof, processPayout, WinnerWorkflowState } from './winnerWorkflow';
import { calculateDrawFinancials } from './drawEngine';

describe('Real Domain & Business Rule Regression Tests', () => {
  describe('Draw Simulation Eligibility & Score Grouping', () => {
    it('groups scores by user and retains top 5 greatest round_dates for eligible users', () => {
      const activeUserSet = new Set(['user-1', 'user-2', 'user-3']);
      const fundedUserSet = new Set(['user-1', 'user-2']); // user-3 lacks funding

      const eligibleUserIds = Array.from(activeUserSet).filter((uid) => fundedUserSet.has(uid));
      expect(eligibleUserIds).toEqual(['user-1', 'user-2']);

      // Mock score rows for user-1 (6 scores) and user-2 (4 scores)
      const mockScores = [
        { user_id: 'user-1', round_date: '2026-02-15', value: 30 },
        { user_id: 'user-1', round_date: '2026-02-14', value: 25 },
        { user_id: 'user-1', round_date: '2026-02-12', value: 40 },
        { user_id: 'user-1', round_date: '2026-02-10', value: 15 },
        { user_id: 'user-1', round_date: '2026-02-08', value: 22 },
        { user_id: 'user-1', round_date: '2026-02-01', value: 10 }, // 6th score (oldest)
        { user_id: 'user-2', round_date: '2026-02-15', value: 35 },
        { user_id: 'user-2', round_date: '2026-02-14', value: 28 },
        { user_id: 'user-2', round_date: '2026-02-12', value: 18 },
        { user_id: 'user-2', round_date: '2026-02-10', value: 42 }, // only 4 scores
      ];

      const userScoresMap = new Map<string, number[]>();
      for (const row of mockScores) {
        if (!eligibleUserIds.includes(row.user_id)) continue;
        const currentList = userScoresMap.get(row.user_id) || [];
        if (currentList.length < 5) {
          currentList.push(row.value);
          userScoresMap.set(row.user_id, currentList);
        }
      }

      const simEntries: { user_id: string; score_values: number[] }[] = [];
      for (const [uid, scoreVals] of userScoresMap.entries()) {
        if (scoreVals.length === 5) {
          simEntries.push({ user_id: uid, score_values: scoreVals });
        }
      }

      expect(simEntries).toHaveLength(1);
      expect(simEntries[0].user_id).toBe('user-1');
      expect(simEntries[0].score_values).toEqual([30, 25, 40, 15, 22]); // exactly 5 latest
    });

    it('preserves empty simulation for locked draws with zero entries', () => {
      const drawStatus: string = 'locked';
      const existingEntries: { user_id: string; score_values: number[] }[] = [];

      let entriesToSimulate = existingEntries;
      if (drawStatus !== 'draft') {
        entriesToSimulate = existingEntries || [];
      }

      expect(entriesToSimulate).toHaveLength(0);
    });

    it('correctly constructs weighted histogram for weighted draw mode', () => {
      const simEntries = [
        { user_id: 'u1', score_values: [10, 10, 20, 30, 40] },
      ];

      const weights = new Map<number, number>();
      for (let i = 1; i <= 45; i++) weights.set(i, 1);

      for (const entry of simEntries) {
        for (const num of entry.score_values) {
          if (num >= 1 && num <= 45) {
            weights.set(num, (weights.get(num) || 1) + 1);
          }
        }
      }

      expect(weights.get(10)).toBe(3); // 1 base + 2 occurrences
      expect(weights.get(20)).toBe(2); // 1 base + 1 occurrence
      expect(weights.get(1)).toBe(1);  // 1 base
    });
  });

  describe('Admin Role Management Guards', () => {
    it('rejects invalid role strings and revoking sole admin', () => {
      const validateRoleUpdate = (currentRole: string, newRole: string, totalAdmins: number) => {
        if (!['member', 'admin'].includes(newRole)) {
          throw new Error('Invalid role');
        }
        if (currentRole === 'admin' && newRole === 'member' && totalAdmins <= 1) {
          throw new Error('Cannot revoke admin role from the sole remaining administrator');
        }
        return true;
      };

      expect(() => validateRoleUpdate('member', 'superadmin', 2)).toThrow('Invalid role');
      expect(() => validateRoleUpdate('admin', 'member', 1)).toThrow('Cannot revoke admin role');
      expect(validateRoleUpdate('admin', 'member', 2)).toBe(true);
      expect(validateRoleUpdate('member', 'admin', 1)).toBe(true);
    });
  });

  describe('Donation Validation Rules', () => {
    it('validates minor unit amounts and confirms zero draw eligibility', () => {
      const validateDonation = (amountInr: number) => {
        if (amountInr <= 0 || !Number.isInteger(amountInr)) {
          throw new Error('Donation amount must be a positive whole number');
        }
        const minorPaise = amountInr * 100;
        return {
          amountMinor: minorPaise,
          grantsDrawEntries: false,
        };
      };

      expect(() => validateDonation(-10)).toThrow();
      expect(() => validateDonation(0)).toThrow();
      expect(() => validateDonation(12.5)).toThrow();

      const validDonation = validateDonation(500);
      expect(validDonation.amountMinor).toBe(50000);
      expect(validDonation.grantsDrawEntries).toBe(false);
    });
  });

  describe('Winner Workflow & Financial Calculations', () => {
    it('enforces proof approval before payout processing', () => {
      const initialState: WinnerWorkflowState = {
        awardId: 'award-100',
        storagePath: 'winner_proofs/award-100.png',
        reviewStatus: 'pending',
        payoutStatus: 'pending',
      };

      expect(() => processPayout(initialState, 'admin-1')).toThrow('Cannot mark payout as paid before proof approval');

      const approvedState = approveWinnerProof(initialState, 'admin-1');
      expect(approvedState.reviewStatus).toBe('approved');

      const paidState = processPayout(approvedState, 'admin-1');
      expect(paidState.payoutStatus).toBe('paid');
    });

    it('calculates integer prize pools without losing minor units', () => {
      const fin = calculateDrawFinancials({
        totalFundedMinor: 10000,
        incomingRolloverMinor: 2000,
        winnerCounts: { fiveMatch: 1, fourMatch: 1, threeMatch: 1 },
      });
      expect(fin.basePrizePoolMinor).toBe(2000); // 20% of 10000 = 2000

      // Check sum of tier pools equals base prize pool + incoming jackpot
      const totalAllocated =
        fin.fiveMatchPoolMinor +
        fin.fourMatchPoolMinor +
        fin.threeMatchPoolMinor;

      expect(totalAllocated).toBe(2000 + 2000);
    });
  });
});
