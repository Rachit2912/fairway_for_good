'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  adminUpdateUserProfileAndScoresAction,
  adminSaveUserScoreAction,
  adminDeleteUserScoreAction,
} from '@/app/actions/adminActions';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  charity_percentage: number;
}

interface Score {
  id: string;
  round_date: string;
  value: number;
}

export function AdminUserDetailClient({
  profile,
  scores,
}: {
  profile: Profile;
  scores: Score[];
}) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [charityPercentage, setCharityPercentage] = useState(profile.charity_percentage);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [roundDate, setRoundDate] = useState('');
  const [scoreValue, setScoreValue] = useState<number | ''>('');
  const [scoreMsg, setScoreMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const res = await adminUpdateUserProfileAndScoresAction(
      profile.id,
      fullName,
      Number(charityPercentage)
    );
    setProfileLoading(false);

    if (res.error) {
      setProfileMsg({ text: res.error, isError: true });
    } else {
      setProfileMsg({ text: 'User profile updated successfully' });
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundDate || scoreValue === '' || Number(scoreValue) < 1 || Number(scoreValue) > 45) {
      setScoreMsg({ text: 'Please select a round date and a score value between 1 and 45', isError: true });
      return;
    }

    setScoreLoading(true);
    setScoreMsg(null);

    const res = await adminSaveUserScoreAction(profile.id, roundDate, Number(scoreValue));
    setScoreLoading(false);

    if (res.error) {
      setScoreMsg({ text: res.error, isError: true });
    } else {
      setScoreMsg({ text: 'Score saved successfully' });
      setRoundDate('');
      setScoreValue('');
    }
  };

  const handleDeleteScore = async (scoreId: string) => {
    setScoreLoading(true);
    setScoreMsg(null);

    const res = await adminDeleteUserScoreAction(scoreId, profile.id);
    setScoreLoading(false);

    if (res.error) {
      setScoreMsg({ text: res.error, isError: true });
    } else {
      setScoreMsg({ text: 'Score deleted successfully' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-xs font-semibold text-[#0f4c46] hover:underline">
            ← Back to Users Directory
          </Link>
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46] mt-1">
            Manage User: {profile.full_name || profile.email}
          </h2>
          <p className="text-xs text-[#1a1d20]/60">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] shadow-sm space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#0f4c46]">Profile & Charity Settings</h3>
          {profileMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold ${
                profileMsg.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1d20]/70 mb-1">
                Charity Percentage (10% - 80%)
              </label>
              <input
                type="number"
                min={10}
                max={80}
                value={charityPercentage}
                onChange={(e) => setCharityPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2.5 rounded-xl bg-[#0f4c46] text-white font-semibold text-xs hover:bg-[#135f58] transition-colors disabled:opacity-50"
            >
              {profileLoading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Score Management */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] shadow-sm space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#0f4c46]">Saved Stableford Scores</h3>
          {scoreMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold ${
                scoreMsg.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {scoreMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveScore} className="space-y-3 bg-[#f4f1ea] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-[#0f4c46]">Add or Update Score</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#1a1d20]/70 mb-1">Round Date</label>
                <input
                  type="date"
                  value={roundDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRoundDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#e2ded4]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#1a1d20]/70 mb-1">Score Value (1-45)</label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#e2ded4]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={scoreLoading}
              className="w-full py-2 rounded-lg bg-[#0f4c46] text-white font-semibold text-xs hover:bg-[#135f58] disabled:opacity-50"
            >
              {scoreLoading ? 'Processing...' : 'Save Score'}
            </button>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1a1d20]/70">Current Retained Top 5 Scores:</p>
            {scores && scores.length > 0 ? (
              <ul className="divide-y divide-[#e2ded4] text-xs">
                {scores.map((s) => (
                  <li key={s.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0f4c46] mr-2">Score: {s.value}</span>
                      <span className="text-[#1a1d20]/60">Date: {s.round_date}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteScore(s.id)}
                      disabled={scoreLoading}
                      className="text-rose-600 font-semibold hover:underline text-[11px]"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-[#1a1d20]/60">No scores recorded for this user.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
