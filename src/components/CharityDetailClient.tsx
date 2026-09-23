'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DonationModal } from '@/components/DonationModal';

interface Charity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  category: string;
  featured: boolean;
}

interface CharityEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string | null;
}

export function CharityDetailClient({
  charity,
  events,
}: {
  charity: Charity;
  events: CharityEvent[];
}) {
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-4">
        <Link href="/charities" className="text-xs font-semibold text-[#0f4c46] hover:underline">
          ← Back to Charities Directory
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-serif font-bold text-[#0f4c46] capitalize">
            {charity.name}
          </h1>
          <button
            onClick={() => setIsDonationOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#0f4c46] text-white text-xs font-semibold hover:bg-[#135f58] transition-colors"
          >
            Donate Directly to {charity.name}
          </button>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-[#84a98c]/20 text-[#0f4c46] text-xs font-semibold rounded-full uppercase">
            {charity.category}
          </span>
          {charity.featured && (
            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-semibold rounded-full uppercase">
              Featured Partner
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#e2ded4] space-y-6 shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">About the Cause</h2>
        <p className="text-sm text-[#1a1d20]/80 leading-relaxed whitespace-pre-line">
          {charity.description}
        </p>

        <div className="pt-6 border-t border-[#e2ded4] space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#1a1d20]">Upcoming Community Events</h3>
          {events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="p-4 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] space-y-1">
                  <h4 className="font-semibold text-sm text-[#0f4c46]">{e.title}</h4>
                  <p className="text-xs text-[#1a1d20]/70">{e.description}</p>
                  <div className="flex justify-between text-[11px] text-[#1a1d20]/60 pt-2 border-t border-[#e2ded4]/50">
                    <span>Date: {new Date(e.event_date).toLocaleDateString()}</span>
                    <span>Location: {e.location || 'Online / Local Venue'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-[#1a1d20]/60">No upcoming events scheduled at this time.</p>
          )}
        </div>
      </div>

      <DonationModal
        charities={[{ id: charity.id, name: charity.name }]}
        defaultCharityId={charity.id}
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />
    </div>
  );
}
