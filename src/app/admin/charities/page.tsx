import { AdminHeader } from '@/components/AdminHeader';

export default function AdminCharitiesPage() {
  const charities = [
    { slug: 'green-grassroots-foundation', name: 'Green Grassroots Foundation', category: 'Environment', active: true, featured: true },
    { slug: 'youth-golf-and-education-initiative', name: 'Youth Golf & Education Initiative', category: 'Education', active: true, featured: true },
    { slug: 'veterans-care-alliance', name: 'Veterans Care Alliance', category: 'Healthcare', active: true, featured: false },
  ];

  return (
    <div>
      <AdminHeader activeTab="/admin/charities" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Charity Directory & Events CRUD</h2>
            <button className="px-4 py-2 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-xs font-semibold hover:bg-[#0a3834] transition-colors">
              + Add Partner Non-Profit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Organization Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Featured Flag</th>
                  <th className="px-4 py-3">Active Status</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {charities.map((c) => (
                  <tr key={c.slug}>
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3 text-xs uppercase text-[#84a98c] font-semibold">{c.category}</td>
                    <td className="px-4 py-3">
                      {c.featured ? <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">Featured</span> : <span className="text-xs text-gray-400">Standard</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">Active</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button className="text-xs font-semibold text-[#0f4c46] hover:underline">Edit</button>
                      <button className="text-xs font-semibold text-[#0f4c46] hover:underline">Add Event</button>
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
