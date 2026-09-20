import { AdminHeader } from '@/components/AdminHeader';

export default function AdminWinnersPage() {
  const pendingWinners = [
    {
      id: 'award_1',
      draw_month: 'March 2026',
      user_name: 'John Golfer',
      user_email: 'member@fairwayforgood.org',
      tier: '4-Match Tier',
      amount: '₹3,500.00',
      proof_status: 'Submitted',
      storage_path: 'winner_proofs/award_1_scorecard.png',
      payout_status: 'Pending Approval',
    },
  ];

  return (
    <div>
      <AdminHeader activeTab="/admin/winners" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">
              Winner Screenshot Verification & Payout Portal
            </h2>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full">
              1 Winner Awaiting Review
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Winner & Draw</th>
                  <th className="px-4 py-3">Tier & Award Amount</th>
                  <th className="px-4 py-3">Scorecard Proof</th>
                  <th className="px-4 py-3">Payout Status</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {pendingWinners.map((w) => (
                  <tr key={w.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{w.user_name}</p>
                      <p className="text-xs text-[#1a1d20]/60">{w.user_email}</p>
                      <p className="text-xs font-medium text-[#0f4c46] mt-0.5">{w.draw_month}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#0f4c46]">{w.amount}</p>
                      <p className="text-xs text-[#1a1d20]/70">{w.tier}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-semibold text-[#0f4c46] hover:underline bg-[#f4f1ea] px-3 py-1.5 rounded-lg border border-[#e2ded4]">
                        View Proof Image ↗
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
                        {w.payout_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors">
                        Approve Proof
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors">
                        Reject
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
  );
}
