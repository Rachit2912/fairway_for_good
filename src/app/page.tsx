import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f1ea] border border-[#e2ded4] text-xs font-medium text-[#0f4c46]">
            <span className="w-2 h-2 rounded-full bg-[#e06d53]" />
            Community-Driven Golf Membership
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-[#1a1d20] tracking-tight leading-tight">
            Your next round can do more.
          </h1>
          <p className="text-lg text-[#1a1d20]/80 leading-relaxed">
            Record your five recent Stableford scores, participate in transparent monthly number draws, and automatically support verified charitable causes with every round you play.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-all shadow-md"
            >
              Start Subscription — ₹999/mo
            </Link>
            <Link
              href="/how-it-works"
              className="px-6 py-3 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] text-[#1a1d20] font-semibold hover:bg-[#e2ded4]/60 transition-all"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Breakdown Cards */}
      <section className="bg-[#f4f1ea] py-16 border-y border-[#e2ded4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-serif font-bold text-[#0f4c46]">
              Transparent Funding Allocation
            </h2>
            <p className="text-sm text-[#1a1d20]/70 mt-2">
              Every monthly subscription is allocated with total transparency across community causes, member prize pools, and platform operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#ffffff] p-8 rounded-2xl border border-[#e2ded4] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#0f4c46]/10 text-[#0f4c46] flex items-center justify-center font-bold text-xl font-serif">
                10%+
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1a1d20]">Charity Impact</h3>
              <p className="text-sm text-[#1a1d20]/70 leading-relaxed">
                Minimum 10% of your subscription goes directly to your selected non-profit. Voluntarily increase your contribution up to 80%.
              </p>
            </div>

            <div className="bg-[#ffffff] p-8 rounded-2xl border border-[#e2ded4] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#e06d53]/10 text-[#e06d53] flex items-center justify-center font-bold text-xl font-serif">
                20%
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1a1d20]">Guaranteed Prize Pool</h3>
              <p className="text-sm text-[#1a1d20]/70 leading-relaxed">
                A fixed 20% of all monthly subscriptions funds the 5-match, 4-match, and 3-match reward tiers for active members.
              </p>
            </div>

            <div className="bg-[#ffffff] p-8 rounded-2xl border border-[#e2ded4] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#84a98c]/20 text-[#0f4c46] flex items-center justify-center font-bold text-xl font-serif">
                100%
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1a1d20]">Verified Results</h3>
              <p className="text-sm text-[#1a1d20]/70 leading-relaxed">
                Cryptographically secure score matching, multiset draw rules, and screenshot verification for top winners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charity Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#0f4c46] text-[#fdfbf7] rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#84a98c]">
              Featured Partner Charity
            </span>
            <h2 className="text-3xl font-serif font-bold">
              Green Grassroots Foundation
            </h2>
            <p className="text-sm text-[#fdfbf7]/80 leading-relaxed">
              Restoring biodiversity and planting native trees around public golf courses and local watersheds. Select Green Grassroots as your designated charity during registration!
            </p>
          </div>
          <Link
            href="/charities/green-grassroots-foundation"
            className="px-6 py-3 rounded-xl bg-[#84a98c] text-[#0f4c46] font-semibold hover:bg-[#84a98c]/90 transition-colors shrink-0"
          >
            Explore Charity Profile
          </Link>
        </div>
      </section>
    </div>
  );
}
