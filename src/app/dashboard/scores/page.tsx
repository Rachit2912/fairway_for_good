import { MemberHeader } from '@/components/MemberHeader';

export default function MemberScoresPage() {
  const scores = [
    { id: '1', round_date: '2026-03-15', value: 38 },
    { id: '2', round_date: '2026-03-10', value: 34 },
    { id: '3', round_date: '2026-03-05', value: 41 },
    { id: '4', round_date: '2026-02-28', value: 29 },
    { id: '5', round_date: '2026-02-20', value: 36 },
  ];

  return (
    <div>
      <MemberHeader activeTab="/dashboard/scores" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        {/* Score Form & Rules Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4 shadow-sm">
            <h2 className="text-xl font-serif font-bold text-[#0f4c46]">Log New Score</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                  Round Date
                </label>
                <input
                  type="date"
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
                  min="1"
                  max="45"
                  required
                  placeholder="36"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-colors"
              >
                Save Score
              </button>
            </form>
          </div>

          {/* Saved Scores Table */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4 shadow-sm">
            <h2 className="text-xl font-serif font-bold text-[#1a1d20]">
              Current 5 Stored Round Scores
            </h2>
            <p className="text-xs text-[#1a1d20]/70">
              Only your latest 5 round dates are retained for monthly draw eligibility. Older scores are automatically pruned upon inserting a newer date.
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
                  {scores.map((score) => (
                    <tr key={score.id}>
                      <td className="px-4 py-3 font-medium">{score.round_date}</td>
                      <td className="px-4 py-3 font-bold text-[#0f4c46]">{score.value}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button className="text-xs font-semibold text-[#0f4c46] hover:underline">
                          Edit
                        </button>
                        <button className="text-xs font-semibold text-rose-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
