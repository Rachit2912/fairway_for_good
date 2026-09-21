'use client';

import { useState } from 'react';
import { createCheckoutSessionAction } from '@/app/actions/billingActions';

export function PricingClient() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planType: 'monthly' | 'annual') {
    setLoading(planType);
    setError(null);
    const res = await createCheckoutSessionAction(planType);
    if (res?.error) {
      setError(res.error);
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#0f4c46]">
          Simple, Transparent Plans
        </h1>
        <p className="text-lg text-[#1a1d20]/80 max-w-2xl mx-auto">
          Every membership tier includes score management, monthly draw entry, and direct charitable support.
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Monthly Plan */}
        <div className="bg-white p-8 rounded-3xl border border-[#e2ded4] shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#0f4c46]">
              Monthly Subscription
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-bold text-[#1a1d20]">₹999</span>
              <span className="text-sm text-[#1a1d20]/70">/ month</span>
            </div>
            <p className="text-sm text-[#1a1d20]/70">
              Flexible month-to-month access. Cancel or adjust your charity percentage anytime.
            </p>
            <ul className="space-y-3 pt-4 text-sm text-[#1a1d20]/80">
              <li className="flex items-center gap-2">✓ 1 Monthly Draw Entry</li>
              <li className="flex items-center gap-2">✓ 5 Saved Stableford Scores</li>
              <li className="flex items-center gap-2">✓ Min 10% (up to 80%) to Selected Charity</li>
              <li className="flex items-center gap-2">✓ Eligible for Tier 5/4/3 Match Prize Pool</li>
            </ul>
          </div>
          <button
            onClick={() => handleCheckout('monthly')}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold text-center hover:bg-[#0a3834] transition-colors shadow-sm disabled:opacity-50"
          >
            {loading === 'monthly' ? 'Redirecting to Stripe...' : 'Choose Monthly'}
          </button>
        </div>

        {/* Annual Plan */}
        <div className="bg-[#0f4c46] text-[#fdfbf7] p-8 rounded-3xl border border-[#0f4c46] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-[#84a98c] text-[#0f4c46] text-xs font-bold px-3 py-1 rounded-full uppercase">
            Save ~16%
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#84a98c]">
              Annual Subscription
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-bold text-white">₹9,990</span>
              <span className="text-sm text-[#fdfbf7]/70">/ year</span>
            </div>
            <p className="text-sm text-[#fdfbf7]/80">
              Allocated smoothly across 12 monthly draws (₹832.50 per coverage month).
            </p>
            <ul className="space-y-3 pt-4 text-sm text-[#fdfbf7]/90">
              <li className="flex items-center gap-2">✓ 12 Monthly Draw Entries</li>
              <li className="flex items-center gap-2">✓ Priority Charity Allocation Tracking</li>
              <li className="flex items-center gap-2">✓ Guaranteed Lock for Year-Round Eligibility</li>
              <li className="flex items-center gap-2">✓ 5 Saved Stableford Scores</li>
            </ul>
          </div>
          <button
            onClick={() => handleCheckout('annual')}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl bg-[#84a98c] text-[#0f4c46] font-semibold text-center hover:bg-[#84a98c]/90 transition-colors disabled:opacity-50"
          >
            {loading === 'annual' ? 'Redirecting to Stripe...' : 'Choose Annual'}
          </button>
        </div>
      </div>
    </div>
  );
}
