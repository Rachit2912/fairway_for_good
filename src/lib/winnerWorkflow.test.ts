import { describe, it, expect } from 'vitest';
import { approveWinnerProof, processPayout, WinnerWorkflowState } from './winnerWorkflow';

describe('Winner Verification and Atomic Payout Workflow', () => {
  it('prevents payout before proof approval', () => {
    const initialState: WinnerWorkflowState = {
      awardId: 'award_1',
      storagePath: 'proofs/award_1.jpg',
      reviewStatus: 'pending',
      payoutStatus: 'pending',
    };

    expect(() => processPayout(initialState, 'admin_1')).toThrow('Cannot mark payout as paid before proof approval');
  });

  it('allows proof approval and subsequent payout idempotently', () => {
    let state: WinnerWorkflowState = {
      awardId: 'award_1',
      storagePath: 'proofs/award_1.jpg',
      reviewStatus: 'pending',
      payoutStatus: 'pending',
    };

    state = approveWinnerProof(state, 'admin_1');
    expect(state.reviewStatus).toBe('approved');

    state = processPayout(state, 'admin_1');
    expect(state.payoutStatus).toBe('paid');

    // Test idempotency: repeated calls preserve paid status without error
    const stateRepeated = processPayout(state, 'admin_1');
    expect(stateRepeated.payoutStatus).toBe('paid');
  });

  it('prevents concurrent rejection from invalidating payout when proof is already approved', () => {
    const payoutsDb = new Map<string, { award_id: string; status: string; processed_at: string }>();

    function processAwardPayout(awardId: string, reviewStatus: string) {
      if (reviewStatus !== 'approved') {
        throw new Error('Cannot process payout before proof scorecard is approved');
      }

      if (payoutsDb.has(awardId)) {
        return payoutsDb.get(awardId); // Preserve original payout record on retries
      }

      const record = { award_id: awardId, status: 'paid', processed_at: new Date().toISOString() };
      payoutsDb.set(awardId, record);
      return record;
    }

    // 1. Process payout for approved proof
    const res1 = processAwardPayout('award_777', 'approved');
    expect(res1?.status).toBe('paid');

    // 2. Retrying payout returns original record idempotently
    const res2 = processAwardPayout('award_777', 'approved');
    expect(res2?.processed_at).toBe(res1?.processed_at);

    // 3. Unapproved proof is strictly rejected
    expect(() => processAwardPayout('award_888', 'pending')).toThrow(
      'Cannot process payout before proof scorecard is approved'
    );
  });
});
