import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import Link from 'next/link';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const { count: memberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: latestDraw } = await supabase
    .from('draws')
    .select('*, draw_financials(*)')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: pendingProofCount } = await supabase
    .from('winner_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'pending');

  return (
    <div>
      <AdminHeader activeTab="/admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Total Members</span>
            <p className="text-3xl font-serif font-bold text-[#0f4c46] mt-2">{memberCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Latest Draw Status</span>
            <p className="text-2xl font-serif font-bold text-[#0f4c46] uppercase mt-2">
              {latestDraw?.status || 'None'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Funded Pool (Latest Draw)</span>
            <p className="text-3xl font-serif font-bold text-[#0f4c46] mt-2">
              ₹{((latestDraw?.draw_financials?.total_funded_minor || 0) / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4]">
            <span className="text-xs font-semibold text-[#1a1d20]/70 uppercase">Pending Proof Reviews</span>
            <p className="text-3xl font-serif font-bold text-[#e06d53] mt-2">{pendingProofCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-4">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Draw Engine Control</h2>
          <p className="text-sm text-[#1a1d20]/70">
            Create new monthly draws, run dry-run simulations, lock eligible entries, generate numbers server-side, and publish official results.
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
