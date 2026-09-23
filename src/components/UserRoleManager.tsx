'use client';

import { useState } from 'react';
import { adminUpdateUserRoleAction, adminReconcileSubscriptionAction } from '@/app/actions/adminActions';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  charity_percentage: number;
  subscriptions?: { status: string; plan_type: string }[] | { status: string; plan_type: string } | null;
  user_roles?: { role: string }[] | { role: string } | null;
}

export function UserRoleManager({ profile }: { profile: Profile }) {
  const rawRole = profile.user_roles as unknown;
  const currentRole = Array.isArray(rawRole)
    ? rawRole[0]?.role
    : (rawRole as { role?: string })?.role || 'member';

  const rawSub = profile.subscriptions as unknown;
  const sub = Array.isArray(rawSub)
    ? rawSub[0]
    : (rawSub as { status?: string; plan_type?: string } | null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleRoleToggle = async () => {
    setLoading(true);
    setMsg(null);
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const res = await adminUpdateUserRoleAction(profile.id, newRole);
    setLoading(false);

    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      setMsg({ text: `Updated role to ${newRole}` });
    }
  };

  const handleReconcile = async () => {
    setLoading(true);
    setMsg(null);
    const res = await adminReconcileSubscriptionAction(profile.id);
    setLoading(false);

    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      setMsg({ text: 'Reconciled with Stripe successfully' });
    }
  };

  return (
    <tr className="border-b border-[#e2ded4] hover:bg-slate-50/50">
      <td className="px-4 py-3">
        <p className="font-semibold text-[#0f4c46]">{profile.full_name || 'User'}</p>
        <p className="text-xs text-[#1a1d20]/60">{profile.email}</p>
        {msg && (
          <p className={`text-[10px] mt-1 font-semibold ${msg.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
            {msg.text}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            currentRole === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {currentRole}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
          {sub?.status || 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-[#0f4c46]">{profile.charity_percentage}%</td>
      <td className="px-4 py-3 text-right space-x-2">
        <button
          onClick={handleRoleToggle}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#e2ded4] rounded-lg text-[#0f4c46] hover:bg-[#f4f1ea] disabled:opacity-50"
        >
          Toggle {currentRole === 'admin' ? 'Member' : 'Admin'}
        </button>
        <button
          onClick={handleReconcile}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-semibold bg-[#0f4c46] text-white rounded-lg hover:bg-[#135f58] disabled:opacity-50"
        >
          Reconcile
        </button>
      </td>
    </tr>
  );
}
