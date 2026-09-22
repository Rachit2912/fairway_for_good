import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase.from('invoices').select('amount_paid');
  const totalSubIncome = invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

  const { data: allocs } = await supabase
    .from('funding_allocations')
    .select('charity_share_minor, prize_share_minor');

  const totalCharityAlloc = allocs?.reduce((sum, a) => sum + a.charity_share_minor, 0) || 0;
  const totalPrizeAlloc = allocs?.reduce((sum, a) => sum + a.prize_share_minor, 0) || 0;

  return (
    <div>
      <AdminHeader activeTab="/admin/reports" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Financial & Impact Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">
                Total Subscriptions Revenue
              </span>
              <p className="text-3xl font-serif font-bold text-[#0f4c46]">
                ₹{(totalSubIncome / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#1a1d20]/60">Sum of paid invoice records</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">
                Total Charity Allocations
              </span>
              <p className="text-3xl font-serif font-bold text-[#0f4c46]">
                ₹{(totalCharityAlloc / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#1a1d20]/60">Allocated to designated causes</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">
                Total Prize Share Funding
              </span>
              <p className="text-3xl font-serif font-bold text-[#0f4c46]">
                ₹{(totalPrizeAlloc / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#1a1d20]/60">Fixed 20% prize pool share</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
