import { MemberHeader } from '@/components/MemberHeader';

export default function MemberCharityPage() {
  return (
    <div>
      <MemberHeader activeTab="/dashboard/charity" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">
              Charity Preference & Share
            </h2>
            <p className="text-sm text-[#1a1d20]/70">
              Select your designated charity and contribution level (10%–80%). Updates take effect on your next subscription invoice.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-2">
                Designated Non-Profit Partner
              </label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]">
                <option value="green-grassroots">Green Grassroots Foundation (Environment)</option>
                <option value="youth-golf">Youth Golf & Education Initiative (Education)</option>
                <option value="veterans-care">Veterans Care Alliance (Healthcare)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-2">
                Charity Split Percentage (10% to 80%)
              </label>
              <input
                type="number"
                min="10"
                max="80"
                defaultValue="15"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
              <p className="text-xs text-[#1a1d20]/60 mt-1">
                Note: 20% is reserved for the fixed member prize pool. The remaining share covers platform operations.
              </p>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-colors"
            >
              Update Charity Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
