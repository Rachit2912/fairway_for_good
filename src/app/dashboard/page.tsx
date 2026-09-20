import { MemberHeader } from '@/components/MemberHeader';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  return (
    <div>
      <MemberHeader activeTab="/dashboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        {/* Status Alert Banner */}
        <div className="bg-[#f4f1ea] border border-[#e2ded4] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="font-semibold text-sm text-[#0f4c46]">Active Subscription</span>
            </div>
            <p className="text-xs text-[#1a1d20]/70">
              Monthly Plan (₹999/mo) • Next billing date: April 1, 2026
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="px-4 py-2 rounded-xl bg-white border border-[#e2ded4] text-xs font-semibold text-[#0f4c46] hover:bg-[#e2ded4]/40 transition-colors"
          >
            Manage Billing
          </Link>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Saved Scores Summary */}
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-[#1a1d20]">My Saved Scores</h2>
              <Link
                href="/dashboard/scores"
                className="text-xs font-semibold text-[#0f4c46] hover:underline"
              >
                Manage Scores →
              </Link>
            </div>
            <p className="text-xs text-[#1a1d20]/70">
              Your recent five Stableford scores participating in the upcoming monthly draw:
            </p>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {[34, 38, 29, 41, 36].map((score, idx) => (
                <div
                  key={idx}
                  className="bg-[#f4f1ea] border border-[#e2ded4] p-3 rounded-xl text-center"
                >
                  <span className="text-xs font-medium text-[#1a1d20]/60 block">R{5 - idx}</span>
                  <span className="text-lg font-bold text-[#0f4c46]">{score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Designated Charity Summary */}
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-[#1a1d20]">Selected Charity</h2>
              <Link
                href="/dashboard/charity"
                className="text-xs font-semibold text-[#0f4c46] hover:underline"
              >
                Change Share →
              </Link>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-[#0f4c46]">Green Grassroots Foundation</h3>
              <p className="text-xs text-[#1a1d20]/70">
                Current Contribution Share: <span className="font-bold text-[#0f4c46]">15%</span> (₹149.85/mo)
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] text-xs text-[#1a1d20]/80">
              Your support directly funds native tree planting and environmental conservation on public golf grounds.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
