'use client';

import { useState } from 'react';
import { createPortalSessionAction } from '@/app/actions/billingActions';

export function MemberBillingClient({
  sub,
  invoices,
}: {
  sub: {
    plan_type: string | null;
    status: string;
    current_period_end: string | null;
    stripe_customer_id: string | null;
  } | null;
  invoices: Array<{
    id: string;
    stripe_invoice_id: string;
    amount_paid: number;
    currency: string;
    paid_at: string;
  }>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleOpenPortal() {
    setLoading(true);
    await createPortalSessionAction();
    setLoading(false);
  }

  const isActive = sub?.status === 'active' || sub?.status === 'trialing';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2ded4] pb-6">
          <div>
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${
                isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {sub?.status || 'Inactive'}
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46] mt-2">
              {sub?.plan_type ? `${sub.plan_type} Membership` : 'No Active Membership'}
            </h2>
            {sub?.current_period_end && (
              <p className="text-xs text-[#1a1d20]/70 mt-1">
                Period End / Renewal Date: {new Date(sub.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>

          <button
            onClick={handleOpenPortal}
            disabled={loading || !sub?.stripe_customer_id}
            className="px-4 py-2.5 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-xs font-semibold hover:bg-[#0a3834] transition-colors disabled:opacity-50"
          >
            {loading ? 'Opening Portal...' : 'Manage Stripe Billing Portal'}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#1a1d20]">Past Invoices</h3>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-semibold text-[#0f4c46]">
                      {new Date(inv.paid_at).toLocaleDateString()} — ₹{(inv.amount_paid / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-[#1a1d20]/70">Invoice #{inv.stripe_invoice_id}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2.5 py-1 rounded-full">
                    Allocated
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#1a1d20]/60 italic">No past invoices recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
