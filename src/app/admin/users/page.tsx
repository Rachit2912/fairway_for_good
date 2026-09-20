import { AdminHeader } from '@/components/AdminHeader';

export default function AdminUsersPage() {
  const users = [
    { id: 'usr_1', email: 'member@fairwayforgood.org', name: 'John Golfer', role: 'member', sub_status: 'active', charity_pct: '15%' },
    { id: 'usr_2', email: 'admin@fairwayforgood.org', name: 'System Admin', role: 'admin', sub_status: 'n/a', charity_pct: '10%' },
  ];

  return (
    <div>
      <AdminHeader activeTab="/admin/users" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">User & Subscription Management</h2>
            <span className="text-xs text-[#1a1d20]/70 font-semibold">Total Accounts: 2</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">User Name / Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription Status</th>
                  <th className="px-4 py-3">Charity Share</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-[#1a1d20]/60">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {u.sub_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#0f4c46]">{u.charity_pct}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-semibold text-[#0f4c46] hover:underline">
                        Edit Settings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
