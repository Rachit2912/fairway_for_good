export type WinnerReviewStatus = 'pending' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'paid';

export interface WinnerWorkflowState {
  awardId: string;
  storagePath: string | null;
  reviewStatus: WinnerReviewStatus;
  payoutStatus: PayoutStatus;
}

export function approveWinnerProof(state: WinnerWorkflowState, _adminId: string): WinnerWorkflowState {
  if (!state.storagePath) {
    throw new Error('Cannot approve winner award without uploaded scorecard proof');
  }
  if (state.reviewStatus === 'approved') {
    return state;
  }
  return {
    ...state,
    reviewStatus: 'approved',
  };
}

export function processPayout(state: WinnerWorkflowState, _adminId: string): WinnerWorkflowState {
  if (state.reviewStatus !== 'approved') {
    throw new Error('Cannot mark payout as paid before proof approval');
  }
  if (state.payoutStatus === 'paid') {
    return state;
  }
  return {
    ...state,
    payoutStatus: 'paid',
  };
}
