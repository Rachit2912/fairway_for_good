'use client';

import { useState } from 'react';
import { saveScoreAction, deleteScoreAction } from '@/app/actions/memberActions';

export function MemberScoresClient({
  initialScores,
}: {
  initialScores: Array<{ id: string; round_date: string; value: number }>;
}) {
  const [scores, setScores] = useState(initialScores);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAddScore(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await saveScoreAction(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Score saved successfully!');
      if (res.data) {
        // Update local client list
        setScores((prev) => {
          const updated = [...prev.filter((s) => s.round_date !== res.data.round_date), res.data];
          return updated.sort((a, b) => b.round_date.localeCompare(a.round_date)).slice(0, 5);
        });
      }
    }
    setLoading(false);
  }

  async function handleDeleteScore(id: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await deleteScoreAction(id);
    if (res.error) {
      setError(res.error);
    } else {
      setScores((prev) => prev.filter((s) => s.id !== id));
      setSuccess('Score deleted successfully.');
    }
    setLoading(false);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Log Score Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-[#0f4c46]">Log New Score</h2>
          <form action={handleAddScore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Round Date
              </label>
              <input
                type="date"
                name="round_date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Stableford Score (1 - 45)
              </label>
              <input
                type="number"
                name="value"
                min="1"
                max="45"
                required
                placeholder="36"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Score'}
            </button>
          </form>
        </div>

        {/* Scores Table */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-[#1a1d20]">
            Current 5 Stored Round Scores
          </h2>
          <p className="text-xs text-[#1a1d20]/70">
            Only your latest 5 round dates are retained for monthly draw eligibility.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Round Date</th>
                  <th className="px-4 py-3">Stableford Value</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {scores.length > 0 ? (
                  scores.map((score) => (
                    <tr key={score.id}>
                      <td className="px-4 py-3 font-medium">{score.round_date}</td>
                      <td className="px-4 py-3 font-bold text-[#0f4c46]">{score.value}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteScore(score.id)}
                          disabled={loading}
                          className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
                      No scores recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
