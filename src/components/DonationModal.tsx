'use client';

import { useState } from 'react';
import { createDonationCheckoutSessionAction } from '@/app/actions/billingActions';

interface CharityOption {
  id: string;
  name: string;
}

export function DonationModal({
  charities,
  defaultCharityId,
  isOpen,
  onClose,
}: {
  charities: CharityOption[];
  defaultCharityId?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedCharityId, setSelectedCharityId] = useState(
    defaultCharityId || (charities[0]?.id ?? '')
  );
  const [amountInr, setAmountInr] = useState<number | ''>(500);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCharityId) {
      setErrorMsg('Please select a charity organization.');
      return;
    }

    if (amountInr === '' || amountInr <= 0 || !Number.isInteger(Number(amountInr))) {
      setErrorMsg('Please enter a valid positive whole number donation amount in INR.');
      return;
    }

    setLoading(true);
    const amountMinorPaise = Math.round(Number(amountInr) * 100);

    const res = await createDonationCheckoutSessionAction(selectedCharityId, amountMinorPaise);
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#e2ded4] shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#e2ded4] pb-4">
          <h3 className="text-xl font-serif font-bold text-[#0f4c46]">Make an Independent Donation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg"
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">
              Select Charity Organization
            </label>
            <select
              value={selectedCharityId}
              onChange={(e) => setSelectedCharityId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            >
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">
              Donation Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
              <input
                type="number"
                min={1}
                step={1}
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
                placeholder="500"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              100% of your voluntary donation goes directly to the selected charity.
            </p>
          </div>

          <div className="p-3 bg-[#f4f1ea] rounded-xl text-[11px] text-[#1a1d20]/80 space-y-1 border border-[#e2ded4]">
            <p className="font-semibold text-[#0f4c46]">Important Information:</p>
            <p>• Independent donations do NOT purchase draw entries or grant draw eligibility.</p>
            <p>• Payment confirmation is verified asynchronously via Stripe webhooks upon settlement.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 rounded-xl border border-[#e2ded4] font-semibold text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 rounded-xl bg-[#0f4c46] text-white font-semibold text-xs hover:bg-[#135f58] transition-colors disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Donate Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
