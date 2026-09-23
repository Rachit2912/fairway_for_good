'use client';

import { useState } from 'react';
import {
  adminCreateCharityAction,
  adminCreateCharityEventAction,
  adminUpdateCharityStatusAction,
} from '@/app/actions/adminActions';

interface Charity {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  category: string;
  featured: boolean;
  active: boolean;
}

export function AdminCharitiesClient({ charities }: { charities: Charity[] }) {
  const [activeTab, setActiveTab] = useState<'directory' | 'create_charity' | 'create_event'>('directory');

  // Charity Form
  const [charityMsg, setCharityMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [charityLoading, setCharityLoading] = useState(false);

  // Event Form
  const [eventMsg, setEventMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [eventLoading, setEventLoading] = useState(false);

  const handleCreateCharity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCharityLoading(true);
    setCharityMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await adminCreateCharityAction(formData);
    setCharityLoading(false);

    if (res.error) {
      setCharityMsg({ text: res.error, isError: true });
    } else {
      setCharityMsg({ text: 'Charity created successfully!' });
      (e.target as HTMLFormElement).reset();
      setActiveTab('directory');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEventLoading(true);
    setEventMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await adminCreateCharityEventAction(formData);
    setEventLoading(false);

    if (res.error) {
      setEventMsg({ text: res.error, isError: true });
    } else {
      setEventMsg({ text: 'Charity event created successfully!' });
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex gap-4 border-b border-[#e2ded4] pb-4">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'directory'
              ? 'bg-[#0f4c46] text-white'
              : 'bg-white text-[#0f4c46] border border-[#e2ded4] hover:bg-[#f4f1ea]'
          }`}
        >
          Non-Profit Directory ({charities.length})
        </button>
        <button
          onClick={() => setActiveTab('create_charity')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'create_charity'
              ? 'bg-[#0f4c46] text-white'
              : 'bg-white text-[#0f4c46] border border-[#e2ded4] hover:bg-[#f4f1ea]'
          }`}
        >
          + Add New Non-Profit
        </button>
        <button
          onClick={() => setActiveTab('create_event')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'create_event'
              ? 'bg-[#0f4c46] text-white'
              : 'bg-white text-[#0f4c46] border border-[#e2ded4] hover:bg-[#f4f1ea]'
          }`}
        >
          + Add Non-Profit Event
        </button>
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Partner Non-Profits Directory</h2>
            <span className="text-xs text-[#1a1d20]/70 font-semibold">Total Charities: {charities.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1a1d20]">
              <thead className="bg-[#f4f1ea] text-[#0f4c46] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Organization Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Featured Flag</th>
                  <th className="px-4 py-3 rounded-r-xl">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2ded4]">
                {charities.length > 0 ? (
                  charities.map((c) => <CharityRow key={c.id} charity={c} />)
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#1a1d20]/60 italic">
                      No charities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Charity Tab */}
      {activeTab === 'create_charity' && (
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm max-w-2xl">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Add New Partner Non-Profit</h2>
          {charityMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold ${
                charityMsg.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {charityMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateCharity} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Organization Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Green Earth Foundation"
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">URL Slug *</label>
              <input
                type="text"
                name="slug"
                required
                placeholder="e.g. green-earth-foundation"
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Tagline</label>
              <input
                type="text"
                name="tagline"
                placeholder="e.g. Protecting forests and wildlife for future generations"
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Category *</label>
              <select
                name="category"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              >
                <option value="Environment">Environment</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Animal Welfare">Animal Welfare</option>
                <option value="Community">Community</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Detailed Description *</label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Provide details about the non-profit mission and impact..."
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="featured" value="true" id="featured_check" className="rounded border-[#e2ded4]" />
              <label htmlFor="featured_check" className="text-xs font-semibold text-[#1a1d20]/80">
                Mark as Featured Non-Profit
              </label>
            </div>

            <button
              type="submit"
              disabled={charityLoading}
              className="w-full py-2.5 rounded-xl bg-[#0f4c46] text-white font-semibold text-xs hover:bg-[#135f58] transition-colors disabled:opacity-50"
            >
              {charityLoading ? 'Creating Non-Profit...' : 'Create Non-Profit'}
            </button>
          </form>
        </div>
      )}

      {/* Create Charity Event Tab */}
      {activeTab === 'create_event' && (
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm max-w-2xl">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Add Non-Profit Event</h2>
          {eventMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold ${
                eventMsg.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {eventMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Select Charity *</label>
              <select
                name="charity_id"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Event Title *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Annual Charity Golf Tournament & Gala"
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Event Date & Time *</label>
              <input
                type="datetime-local"
                name="event_date"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Royal Golf Club, New Delhi"
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Event Description *</label>
              <textarea
                name="description"
                rows={3}
                required
                placeholder="Describe the event purpose and participation details..."
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <button
              type="submit"
              disabled={eventLoading}
              className="w-full py-2.5 rounded-xl bg-[#0f4c46] text-white font-semibold text-xs hover:bg-[#135f58] transition-colors disabled:opacity-50"
            >
              {eventLoading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function CharityRow({ charity }: { charity: Charity }) {
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
