'use client';

import { useState } from 'react';
import { uploadWinnerProofAction } from '@/app/actions/adminActions';

export function MemberWinningsClient({
  awards,
}: {
  awards: Array<{
    id: string;
    tier: number;
    amount_minor: number;
    draws: { year: number; month: number } | null;
    winner_submissions: { review_status: string; rejection_reason: string | null } | null;
  }>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpload(awardId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(awardId);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const res = await uploadWinnerProofAction(awardId, formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Scorecard screenshot proof uploaded successfully!');
    }
    setLoading(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
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
        <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">My Prize Winnings</h2>

        {awards.length > 0 ? (
          awards.map((award) => {
            const status = award.winner_submissions?.review_status || 'unsubmitted';
            return (
              <div key={award.id} className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-semibold text-[#e06d53]">
                      {award.tier}-Match Winner
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#0f4c46]">
                      {award.draws ? `${award.draws.month}/${award.draws.year} Monthly Draw` : 'Monthly Draw'}
                    </h3>
                    <p className="text-xs text-[#1a1d20]/70">
                      Award Amount: ₹{(award.amount_minor / 100).toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    Proof Status: {status}
                  </span>
                </div>

                {status !== 'approved' && (
                  <form onSubmit={(e) => handleUpload(award.id, e)} className="pt-4 border-t border-[#e2ded4] space-y-3">
                    <h4 className="text-sm font-semibold text-[#1a1d20]">Upload Golf Scorecard Screenshot Proof</h4>
                    <p className="text-xs text-[#1a1d20]/70">
                      Upload a clear JPEG, PNG, or WebP image (max 5MB) of your official scorecard.
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                      <input
                        type="file"
                        name="proof_file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        className="text-xs text-[#1a1d20]/80"
                      />
                      <button
                        type="submit"
                        disabled={loading === award.id}
                        className="px-4 py-2 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-xs font-semibold hover:bg-[#0a3834] transition-colors disabled:opacity-50"
                      >
                        {loading === award.id ? 'Uploading...' : 'Submit Proof'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[#1a1d20]/60 italic">No prize awards recorded yet.</p>
        )}
      </div>
    </div>
  );
}
