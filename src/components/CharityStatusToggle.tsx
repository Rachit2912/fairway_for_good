'use client';

import { useState } from 'react';
import { adminUpdateCharityStatusAction } from '@/app/actions/adminActions';

interface Charity {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  category: string;
  featured: boolean;
  active: boolean;
}

export function CharityStatusToggle({ charity }: { charity: Charity }) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(charity.active);
  const [featured, setFeatured] = useState(charity.featured);

  const handleToggleActive = async () => {
    setLoading(true);
    const newActive = !active;
    const res = await adminUpdateCharityStatusAction(charity.id, newActive, featured);
    setLoading(false);
    if (!res.error) {
      setActive(newActive);
    }
  };

  const handleToggleFeatured = async () => {
    setLoading(true);
    const newFeatured = !featured;
    const res = await adminUpdateCharityStatusAction(charity.id, active, newFeatured);
    setLoading(false);
    if (!res.error) {
      setFeatured(newFeatured);
    }
  };

  return (
    <tr className="border-b border-[#e2ded4] hover:bg-slate-50/50">
      <td className="px-4 py-3">
        <p className="font-semibold text-[#0f4c46]">{charity.name}</p>
        <p className="text-xs text-[#1a1d20]/60">{charity.tagline}</p>
      </td>
      <td className="px-4 py-3 text-xs uppercase text-[#84a98c] font-semibold">{charity.category}</td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggleFeatured}
          disabled={loading}
          className={`text-xs px-2.5 py-1 rounded font-semibold border transition-colors ${
            featured
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {featured ? 'Featured' : 'Standard'}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggleActive}
          disabled={loading}
          className={`text-xs px-2.5 py-1 rounded font-semibold uppercase border transition-colors ${
            active
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-rose-100 text-rose-900 border-rose-300'
          }`}
        >
          {active ? 'Active' : 'Archived'}
        </button>
      </td>
    </tr>
  );
}
