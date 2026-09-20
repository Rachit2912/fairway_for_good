import { MemberHeader } from '@/components/MemberHeader';

export default function MemberSettingsPage() {
  return (
    <div>
      <MemberHeader activeTab="/dashboard/settings" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Account Settings</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                defaultValue="John Golfer"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                defaultValue="member@fairwayforgood.org"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-[#1a1d20]/60 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-colors"
            >
              Save Account Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
