import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase.from('profiles').select(`
      id,
      email,
      full_name,
      charity_percentage,
      subscriptions (
        status,
        plan_type
      ),
      user_roles (
        role
      )
    `);

  return (
    <div>
      <AdminHeader activeTab="/admin/users" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">User & Subscription Directory</h2>
            <span className="text-xs text-[#1a1d20]/70 font-semibold">
              Total Accounts: {profiles?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">User Name / Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription Status</th>
                  <th className="px-4 py-3 rounded-r-xl">Charity Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {profiles && profiles.length > 0 ? (
                  profiles.map((p) => {
                    const roleData = p.user_roles as unknown as Array<{ role: string }> | null;
                    const role = roleData?.[0]?.role || 'member';
                    const subData = p.subscriptions as unknown as Array<{ status: string; plan_type: string }> | null;
                    const sub = subData?.[0];

                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{p.full_name || 'User'}</p>
                          <p className="text-xs text-[#1a1d20]/60">{p.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                            {sub?.status || 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#0f4c46]">{p.charity_percentage}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
                      No user accounts found.
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
