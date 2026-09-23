import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { CharityStatusToggle } from '@/components/CharityStatusToggle';

export default async function AdminCharitiesPage() {
  const supabase = await createClient();

  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <AdminHeader activeTab="/admin/charities" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Partner Non-Profits Directory</h2>
            <span className="text-xs text-[#1a1d20]/70 font-semibold">
              Total Charities: {charities?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Organization Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Featured Flag</th>
                  <th className="px-4 py-3 rounded-r-xl">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {charities && charities.length > 0 ? (
                  charities.map((c) => (
                    <CharityStatusToggle key={c.id} charity={c} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
                      No charities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
