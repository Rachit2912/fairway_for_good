import { AdminHeader } from '@/components/AdminHeader';

export default function AdminReportsPage() {
  return (
    <div>
      <AdminHeader activeTab="/admin/reports" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Financial & Impact Reports</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Total Subscriptions Income</span>
              <p className="text-3xl font-serif font-bold text-[#0f4c46]">₹127,872.00</p>
              <p className="text-xs text-[#1a1d20]/60">Cumulative minor units tracked</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Total Charity Allocations</span>
              <p className="text-3xl font-serif font-bold text-[#0f4c46]">₹19,180.80</p>
              <p className="text-xs text-[#1a1d20]/60">Disbursable to partner causes</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Total Prize Pool Disbursed</span>
              <p className="text-3xl font-serif font-bold text-[#0f4c46]">₹25,574.40</p>
              <p className="text-xs text-[#1a1d20]/60">Allocated to 5/4/3 match tiers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
