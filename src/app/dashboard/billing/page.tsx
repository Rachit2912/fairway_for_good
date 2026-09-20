import { MemberHeader } from '@/components/MemberHeader';

export default function MemberBillingPage() {
  return (
    <div>
      <MemberHeader activeTab="/dashboard/billing" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e2ded4] pb-6">
            <div>
              <span className="text-xs font-semibold uppercase text-emerald-600">Active</span>
              <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Monthly Membership</h2>
              <p className="text-xs text-[#1a1d20]/70">₹999 / month • Renews April 1, 2026</p>
            </div>

            <button className="px-4 py-2 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-xs font-semibold hover:bg-[#0a3834] transition-colors">
              Open Stripe Billing Portal
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-[#1a1d20]">Past Invoices</h3>
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-[#0f4c46]">March 1, 2026 — ₹999.00</p>
                <p className="text-xs text-[#1a1d20]/70">Invoice #in_test_12345 • Paid</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2.5 py-1 rounded-full">
                Allocated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
