'use client';

import { useState } from 'react';
import {
  adminReviewProofAction,
  adminProcessPayoutAction,
  getWinnerProofSignedUrlAction,
} from '@/app/actions/adminActions';

export function AdminWinnersClient({
  submissions,
}: {
  submissions: Array<{
    id: string;
    award_id: string;
    review_status: string;
    storage_path: string;
    rejection_reason: string | null;
    draw_awards: {
      tier: number;
      amount_minor: number;
      profiles: { full_name: string; email: string } | null;
      payouts: { status: string } | null;
    } | null;
  }>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleViewProof(storagePath: string) {
    setError(null);
    const res = await getWinnerProofSignedUrlAction(storagePath);
    if (res?.error) {
      setError(res.error);
    } else if (res?.signedUrl) {
      window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleReview(awardId: string, approved: boolean) {
    setLoading(awardId);
    setError(null);
    setSuccess(null);

    const res = await adminReviewProofAction(awardId, approved);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(`Proof ${approved ? 'approved' : 'rejected'} successfully.`);
    }
    setLoading(null);
  }

  async function handlePayout(awardId: string) {
    setLoading(awardId);
    setError(null);
    setSuccess(null);

    const res = await adminProcessPayoutAction(awardId);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Payout processed and marked as paid.');
    }
    setLoading(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {success}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">
          Winner Screenshot Verification & Payout Portal
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1a1d20]">
            <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Winner Details</th>
                <th className="px-4 py-3">Tier & Award Amount</th>
                <th className="px-4 py-3">Scorecard Proof</th>
                <th className="px-4 py-3">Review Status</th>
                <th className="px-4 py-3">Payout Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ded4]">
              {submissions.length > 0 ? (
                submissions.map((sub) => {
                  const award = sub.draw_awards;
                  const profile = award?.profiles;
                  const payoutStatus = award?.payouts?.status || 'pending';

                  return (
                    <tr key={sub.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{profile?.full_name || 'Member'}</p>
                        <p className="text-xs text-[#1a1d20]/60">{profile?.email || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#0f4c46]">
                          ₹{((award?.amount_minor || 0) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-[#1a1d20]/70">{award?.tier}-Match Tier</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewProof(sub.storage_path)}
                          className="text-xs font-semibold text-[#0f4c46] hover:underline bg-[#f4f1ea] px-3 py-1.5 rounded-lg border border-[#e2ded4]"
                        >
                          View Signed Proof ↗
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                          {sub.review_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                          {payoutStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {sub.review_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReview(sub.award_id, true)}
                              disabled={loading === sub.award_id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(sub.award_id, false)}
                              disabled={loading === sub.award_id}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {sub.review_status === 'approved' && payoutStatus !== 'paid' && (
                          <button
                            onClick={() => handlePayout(sub.award_id)}
                            disabled={loading === sub.award_id}
                            className="px-3 py-1.5 rounded-lg bg-[#0f4c46] text-white text-xs font-semibold hover:bg-[#0a3834] transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
                    No winner submissions awaiting review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
