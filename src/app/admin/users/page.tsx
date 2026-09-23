import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { UserRoleManager } from '@/components/UserRoleManager';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles, error: err } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      charity_percentage,
      subscriptions!fk_subscriptions_profile (
        status,
        plan_type
      ),
      user_roles!fk_user_roles_profile (
        role
      )
    `);

  if (err) {
    console.error('Database query error in /admin/users:', err.message);
  }

  return (
    <div>
      <AdminHeader activeTab="/admin/users" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        {err && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            Database Error: {err.message}
          </div>
        )}

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
                  <th className="px-4 py-3">Charity Share</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {profiles && profiles.length > 0 ? (
                  profiles.map((p) => (
                    <UserRoleManager key={p.id} profile={p} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
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
