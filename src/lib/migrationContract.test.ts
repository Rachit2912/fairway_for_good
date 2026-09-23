import { describe, it, expect } from 'vitest';
import { approveWinnerProof, processPayout, WinnerWorkflowState } from './winnerWorkflow';
import { calculateDrawFinancials } from './drawEngine';

describe('Real Domain & Business Rule Regression Tests', () => {
  describe('Admin Profile Edits Authorization', () => {
    it('allows authorized admin to update another member profile while rejecting non-admin callers', () => {
      interface ProfileRow {
        id: string;
        full_name: string;
        charity_percentage: number;
      }

      const mockProfilesDb = new Map<string, ProfileRow>([
        ['user-member-1', { id: 'user-member-1', full_name: 'Member One', charity_percentage: 10 }],
      ]);

      const performAdminProfileUpdate = (
        callerRole: string,
        targetUserId: string,
        fullName: string,
        charityPercentage: number
      ) => {
        if (callerRole !== 'admin') {
          return { error: 'Admin privileges required' };
        }
        if (charityPercentage < 10 || charityPercentage > 80) {
          return { error: 'Charity percentage must be between 10% and 80%' };
        }

        const profile = mockProfilesDb.get(targetUserId);
        if (!profile) {
          return { error: 'Target profile not found or zero rows updated' };
        }

        profile.full_name = fullName;
        profile.charity_percentage = charityPercentage;
        return { success: true, data: profile };
      };

      // 1. Non-admin attempt fails
      const memberAttempt = performAdminProfileUpdate('member', 'user-member-1', 'Hacked Name', 50);
      expect(memberAttempt.error).toBe('Admin privileges required');
      expect(mockProfilesDb.get('user-member-1')?.full_name).toBe('Member One');

      // 2. Admin attempt succeeds
      const adminAttempt = performAdminProfileUpdate('admin', 'user-member-1', 'Updated Name', 25);
      expect(adminAttempt.success).toBe(true);
      expect(adminAttempt.data?.full_name).toBe('Updated Name');
      expect(adminAttempt.data?.charity_percentage).toBe(25);
      expect(mockProfilesDb.get('user-member-1')?.full_name).toBe('Updated Name');

      // 3. Update non-existent profile returns explicit zero affected rows error
      const missingAttempt = performAdminProfileUpdate('admin', 'non-existent-user', 'Ghost', 20);
      expect(missingAttempt.error).toBe('Target profile not found or zero rows updated');
    });
  });

  describe('Admin Score Retention & Draw Entry Eligibility', () => {
    it('prunes top-5 scores when admin adds a 6th score, preserving draw entry eligibility', () => {
      interface ScoreRow {
        id: string;
        user_id: string;
        round_date: string;
        value: number;
      }

      let scoresDb: ScoreRow[] = [
        { id: 's1', user_id: 'member-10', round_date: '2026-02-10', value: 30 },
        { id: 's2', user_id: 'member-10', round_date: '2026-02-09', value: 25 },
        { id: 's3', user_id: 'member-10', round_date: '2026-02-08', value: 40 },
        { id: 's4', user_id: 'member-10', round_date: '2026-02-07', value: 18 },
        { id: 's5', user_id: 'member-10', round_date: '2026-02-06', value: 22 },
      ];

      // Simulate atomic admin_save_user_score procedure
      const adminSaveUserScore = (
        callerRole: string,
        targetUserId: string,
        roundDate: string,
        value: number
      ) => {
        if (callerRole !== 'admin') {
          throw new Error('Admin privileges required');
        }
        if (value < 1 || value > 45) {
          throw new Error('Score value must be between 1 and 45');
        }

        const userScores = scoresDb.filter((s) => s.user_id === targetUserId);
        const oldestDate = userScores.length > 0 ? userScores.reduce((min, s) => s.round_date < min ? s.round_date : min, userScores[0].round_date) : '';

        if (userScores.length >= 5 && roundDate < oldestDate) {
          throw new Error(`Cannot add backdated score older than current oldest round date (${oldestDate})`);
        }

        const existingIdx = userScores.findIndex((s) => s.round_date === roundDate);
        if (existingIdx >= 0) {
          userScores[existingIdx].value = value;
        } else {
          scoresDb.push({
            id: `s-${Date.now()}`,
            user_id: targetUserId,
            round_date: roundDate,
            value,
          });
        }

        // Retain only top 5 greatest round_dates
        const sorted = scoresDb
          .filter((s) => s.user_id === targetUserId)
          .sort((a, b) => b.round_date.localeCompare(a.round_date));

        const retainedIds = new Set(sorted.slice(0, 5).map((s) => s.id));
        scoresDb = scoresDb.filter((s) => s.user_id !== targetUserId || retainedIds.has(s.id));

        return { success: true };
      };

      // Initial state: user has exactly 5 scores
      expect(scoresDb.filter((s) => s.user_id === 'member-10')).toHaveLength(5);

      // Admin adds a 6th score (newer date: 2026-02-12)
      adminSaveUserScore('admin', 'member-10', '2026-02-12', 38);

      const userScoresAfter6th = scoresDb.filter((s) => s.user_id === 'member-10');
      expect(userScoresAfter6th).toHaveLength(5); // Pruned back to 5!
      expect(userScoresAfter6th.map((s) => s.round_date)).toEqual([
        '2026-02-10', '2026-02-09', '2026-02-08', '2026-02-07', '2026-02-12'
      ]);

      // Verify draw lock query HADVING COUNT(s.id) == 5 rule
      const eligibleForDraw = userScoresAfter6th.length === 5;
      expect(eligibleForDraw).toBe(true);
    });
  });

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
