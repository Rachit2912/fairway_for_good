import { MemberHeader } from '@/components/MemberHeader';

export default function MemberWinningsPage() {
  return (
    <div>
      <MemberHeader activeTab="/dashboard/winnings" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">My Prize Winnings</h2>
          <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-[#e06d53]">4-Match Winner</span>
                <h3 className="text-xl font-serif font-bold text-[#0f4c46]">March 2026 Monthly Draw</h3>
                <p className="text-xs text-[#1a1d20]/70">Award Amount: ₹3,500.00</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full">
                Proof Verification Pending
              </span>
            </div>

            <div className="pt-4 border-t border-[#e2ded4] space-y-3">
              <h4 className="text-sm font-semibold text-[#1a1d20]">Upload Golf Scorecard Screenshot Proof</h4>
              <p className="text-xs text-[#1a1d20]/70">
                Please upload a clear JPEG, PNG, or WebP image (max 5MB) of your official round scorecard to verify award entitlement.
              </p>
              <div className="flex items-center gap-4 pt-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs text-[#1a1d20]/80"
                />
                <button className="px-4 py-2 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-xs font-semibold hover:bg-[#0a3834] transition-colors">
                  Submit Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
