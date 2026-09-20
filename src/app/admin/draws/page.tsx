import { AdminHeader } from '@/components/AdminHeader';
import Link from 'next/link';

export default function AdminDrawsPage() {
  return (
    <div>
      <AdminHeader activeTab="/admin/draws" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                Status: Draft
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#0f4c46] mt-2">
                March 2026 Monthly Draw Control
              </h2>
            </div>
            <Link
              href="/admin/draws/march-2026"
              className="px-4 py-2 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-xs font-semibold hover:bg-[#0a3834] transition-colors"
            >
              Configure & Simulate
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#e2ded4]">
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Eligible Entries</span>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">128 Members</p>
            </div>
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Base Prize Pool</span>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">₹25,574.00</p>
            </div>
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Rollover Pool</span>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">₹0.00</p>
            </div>
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <span className="text-xs uppercase font-semibold text-[#1a1d20]/70">Algorithm Mode</span>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">Weighted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
