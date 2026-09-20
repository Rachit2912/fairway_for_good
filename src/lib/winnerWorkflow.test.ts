import { describe, it, expect } from 'vitest';
import { approveWinnerProof, processPayout, WinnerWorkflowState } from './winnerWorkflow';

describe('Winner Verification and Payout Workflow', () => {
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

    const stateRepeated = processPayout(state, 'admin_1');
    expect(stateRepeated.payoutStatus).toBe('paid');
  });
});
