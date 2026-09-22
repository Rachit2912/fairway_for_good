'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminCreateDrawAction } from '@/app/actions/adminActions';

export function AdminDrawsClient({
  draws,
}: {
  draws: Array<{
    id: string;
    year: number;
    month: number;
    status: string;
    mode: string;
    locked_at: string | null;
    published_at: string | null;
  }>;
}) {
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);
  const [mode, setMode] = useState<'random' | 'weighted'>('random');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleCreateDraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await adminCreateDrawAction(year, month, mode);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(`Created draft draw for ${month}/${year}!`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Create New Draw Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-[#0f4c46]">Create New Monthly Draw</h2>
        <form onSubmit={handleCreateDraw} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              required
              className="w-full px-4 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">Month (1-12)</label>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              required
              className="w-full px-4 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">Draw Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'random' | 'weighted')}
              className="w-full px-4 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            >
              <option value="random">Uniform Random</option>
              <option value="weighted">Score-Frequency Weighted</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-4 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold text-xs hover:bg-[#0a3834] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Draft Draw'}
          </button>
        </form>
      </div>

      {/* Draws List */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-[#1a1d20]">All Monthly Draws</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1a1d20]">
            <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Draw Month</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ded4]">
              {draws.length > 0 ? (
                draws.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-semibold">
                      Draw {d.month}/{d.year}
                    </td>
                    <td className="px-4 py-3 text-xs uppercase text-[#84a98c] font-semibold">{d.mode}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/draws/${d.id}`}
                        className="text-xs font-semibold text-[#0f4c46] hover:underline"
                      >
                        Manage Lifecycle →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
                    No draws created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
