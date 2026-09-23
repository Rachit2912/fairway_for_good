'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DonationModal } from '@/components/DonationModal';

interface Charity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  category: string;
  featured: boolean;
}

export function CharitiesClient({
  charities,
  donationSuccess,
  donationCanceled,
}: {
  charities: Charity[];
  donationSuccess?: boolean;
  donationCanceled?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharityId, setSelectedCharityId] = useState<string | undefined>(undefined);

  const handleOpenDonation = (charityId?: string) => {
    setSelectedCharityId(charityId);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {donationSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold space-y-1">
          <p className="text-sm font-bold">Thank you for your donation order!</p>
          <p>
            Your payment checkout was submitted. Please note that payment confirmation is verified asynchronously via Stripe webhooks upon settlement.
          </p>
          <p className="text-[11px] text-emerald-700 italic">
            Reminder: Voluntary donations do NOT grant draw entries or eligibility.
          </p>
        </div>
      )}

      {donationCanceled && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold">
          Donation checkout was canceled. No payment was charged.
        </div>
      )}

      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-[#0f4c46]">
          Partner Non-Profits & Causes
        </h1>
        <p className="text-sm text-[#1a1d20]/70">
          Browse our verified partner organizations. Every subscriber directs at least 10% (up to 80%) of their subscription towards these impactful projects. You may also make an independent direct donation.
        </p>
        <button
          onClick={() => handleOpenDonation()}
          className="px-6 py-3 rounded-2xl bg-[#0f4c46] text-white text-xs font-semibold shadow-md hover:bg-[#135f58] transition-colors"
        >
          Make a Voluntary Direct Donation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {charities.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-[#e2ded4] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-[#84a98c] tracking-wider">
                  {c.category}
                </span>
                {c.featured && (
                  <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Featured Cause
                  </span>
                )}
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1a1d20]">{c.name}</h2>
              <p className="text-sm text-[#1a1d20]/70 leading-relaxed">{c.tagline || 'Supporting vital social and environmental initiatives.'}</p>
            </div>

            <div className="p-6 pt-0 space-y-2">
              <Link
                href={`/charities/${c.slug}`}
                className="inline-block w-full text-center py-2.5 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] text-xs font-semibold text-[#0f4c46] hover:bg-[#e2ded4] transition-colors"
              >
                View Profile & Events
              </Link>
              <button
                onClick={() => handleOpenDonation(c.id)}
                className="w-full py-2.5 rounded-xl bg-[#0f4c46] text-white text-xs font-semibold hover:bg-[#135f58] transition-colors"
              >
                Donate Directly
              </button>
            </div>
          </div>
        ))}
      </div>

      <DonationModal
        charities={charities.map((c) => ({ id: c.id, name: c.name }))}
        defaultCharityId={selectedCharityId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
