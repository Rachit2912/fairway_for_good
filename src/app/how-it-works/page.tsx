import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#0f4c46]">
          How Fairway for Good Works
        </h1>
        <p className="text-lg text-[#1a1d20]/80 max-w-2xl mx-auto">
          Combining your passion for golf with transparent charitable giving and exciting monthly score-based prize draws.
        </p>
      </div>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl border border-[#e2ded4]">
          <div className="w-12 h-12 rounded-full bg-[#0f4c46] text-[#fdfbf7] flex items-center justify-center font-bold text-xl shrink-0">
            1
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">
              Subscribe & Choose Your Charity
            </h2>
            <p className="text-[#1a1d20]/80 leading-relaxed">
              Choose between monthly (₹999) or annual (₹9,990) membership. Select any verified partner non-profit and designate your contribution level between 10% and 80% of your subscription fee.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl border border-[#e2ded4]">
          <div className="w-12 h-12 rounded-full bg-[#0f4c46] text-[#fdfbf7] flex items-center justify-center font-bold text-xl shrink-0">
            2
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">
              Log Your Recent 5 Stableford Scores
            </h2>
            <p className="text-[#1a1d20]/80 leading-relaxed">
              Enter your latest five golf scores (integers 1–45) along with round dates. Our database retains your five greatest round dates automatically. Keep your scores updated before the end-of-month draw lock.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl border border-[#e2ded4]">
          <div className="w-12 h-12 rounded-full bg-[#0f4c46] text-[#fdfbf7] flex items-center justify-center font-bold text-xl shrink-0">
            3
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">
              Monthly 5-Number Draw & Multiset Matching
            </h2>
            <p className="text-[#1a1d20]/80 leading-relaxed">
              At lock time, five winning numbers (1–45) are generated using random or score-weighted algorithms. Your five saved scores form your official draw entry. Matches are evaluated using exact multiset intersection rules across 5-, 4-, and 3-match tiers.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl border border-[#e2ded4]">
          <div className="w-12 h-12 rounded-full bg-[#0f4c46] text-[#fdfbf7] flex items-center justify-center font-bold text-xl shrink-0">
            4
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">
              Claim Winnings & Verify Proof
            </h2>
            <p className="text-[#1a1d20]/80 leading-relaxed">
              Winning members submit a official golf scorecard screenshot. Once verified by site administrators, payouts are disbursed. Any unawarded 5-match jackpot rolls over into the following month’s draw!
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-8">
        <Link
          href="/signup"
          className="px-8 py-4 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold text-lg hover:bg-[#0a3834] transition-all shadow-md inline-block"
        >
          Join Fairway for Good Today
        </Link>
      </div>
    </div>
  );
}
