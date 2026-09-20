import { AdminHeader } from '@/components/AdminHeader';
import Link from 'next/link';

export default function AdminOverviewPage() {
  return (
    <div>
      <AdminHeader activeTab="/admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Total Active Members</span>
            <p className="text-3xl font-serif font-bold text-[#0f4c46] mt-2">128</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Current Month Pool</span>
            <p className="text-3xl font-serif font-bold text-[#0f4c46] mt-2">₹25,574</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Allocated Charity Funds</span>
            <p className="text-3xl font-serif font-bold text-[#0f4c46] mt-2">₹19,180</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Pending Proof Approvals</span>
            <p className="text-3xl font-serif font-bold text-[#e06d53] mt-2">1</p>
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-4">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Current Draw Status: Draft</h2>
          <p className="text-sm text-[#1a1d20]/70">
            March 2026 draw is ready for configuration, dry-run simulation, and monthly entry locking.
          </p>
          <Link
            href="/admin/draws"
            className="inline-block px-6 py-3 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-sm font-semibold hover:bg-[#0a3834] transition-colors"
          >
            Manage Monthly Draw Engine →
          </Link>
        </div>
      </div>
    </div>
  );
}
