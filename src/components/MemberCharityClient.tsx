'use client';

import { useState } from 'react';
import { updateCharitySettingsAction } from '@/app/actions/memberActions';

export function MemberCharityClient({
  charities,
  selectedCharityId,
  charityPercentage,
}: {
  charities: Array<{ id: string; name: string; category: string }>;
  selectedCharityId?: string;
  charityPercentage: number;
}) {
  const [selectedId, setSelectedId] = useState(selectedCharityId || (charities[0]?.id ?? ''));
  const [percentage, setPercentage] = useState(charityPercentage || 10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('charity_id', selectedId);
    formData.append('charity_percentage', percentage.toString());

    const res = await updateCharitySettingsAction(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Charity preference updated successfully!');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
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

      <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">
            Charity Preference & Share
          </h2>
          <p className="text-sm text-[#1a1d20]/70">
            Select your designated charity and contribution level (10%–80%).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-2">
              Designated Non-Profit Partner
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            >
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-2">
              Charity Split Percentage (10% to 80%)
            </label>
            <input
              type="number"
              min="10"
              max="80"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value, 10) || 10)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            />
            <p className="text-xs text-[#1a1d20]/60 mt-1">
              Note: 20% is reserved for the fixed member prize pool.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Charity Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
