import { MemberHeader } from '@/components/MemberHeader';

export default function MemberDrawsPage() {
  return (
    <div>
      <MemberHeader activeTab="/dashboard/draws" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">My Draw Participation</h2>
          <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0f4c46]">March 2026 Monthly Draw</h3>
                <p className="text-xs text-[#1a1d20]/70">Official Draw Entry Snapshot</p>
              </div>
              <span className="text-xs bg-[#84a98c]/30 text-[#0f4c46] font-semibold px-3 py-1 rounded-full">
                Locked & Entry Eligible
              </span>
            </div>

            <div className="pt-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70 block mb-2">
                Your 5 Submitted Scores
              </span>
              <div className="flex gap-3">
                {[38, 34, 41, 29, 36].map((score, idx) => (
                  <span
                    key={idx}
                    className="w-10 h-10 rounded-full bg-[#0f4c46] text-white font-bold text-sm flex items-center justify-center shadow-sm"
                  >
                    {score}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
