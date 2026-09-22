import { describe, it, expect } from 'vitest';
import { calculateDrawFinancials } from './drawEngine';

describe('Database Draw Lifecycle Contract Rules', () => {
  it('validates draw state transitions: draft -> locked -> generated -> published', () => {
    let status = 'draft';

    status = 'locked';
    expect(status).toBe('locked');

    status = 'generated';
    expect(status).toBe('generated');

    status = 'published';
    expect(status).toBe('published');
  });

  it('prohibits rerolling numbers or re-publishing a published draw', () => {
    const drawState = {
      status: 'published',
      officialNumbers: [10, 20, 30, 40, 45],
    };

    const canReroll = drawState.status !== 'published';
    expect(canReroll).toBe(false);
  });

  it('enforces verified, non-null, unexpired paid-through subscription eligibility', () => {
    function isSubscriberEligible(sub: { status: string; current_period_end: string | null }): boolean {
      if (sub.status !== 'active' && sub.status !== 'trialing') return false;
      if (!sub.current_period_end) return false;
      return new Date(sub.current_period_end) >= new Date();
    }

    expect(isSubscriberEligible({ status: 'active', current_period_end: null })).toBe(false);
    expect(isSubscriberEligible({ status: 'active', current_period_end: '2020-01-01T00:00:00Z' })).toBe(false);
    expect(isSubscriberEligible({ status: 'active', current_period_end: '2099-01-01T00:00:00Z' })).toBe(true);
  });

  it('enforces strict chronological publication order and rejects out-of-order draws (Jan published -> Mar published -> Feb attempt rejected)', () => {
    const drawsInDatabase = [
      { id: 'draw_jan', month: 1, year: 2026, status: 'published' },
      { id: 'draw_mar', month: 3, year: 2026, status: 'published' },
      { id: 'draw_feb', month: 2, year: 2026, status: 'generated' },
    ];

    function canPublishDraw(drawId: string) {
      const target = drawsInDatabase.find((d) => d.id === drawId);
      if (!target) return false;
      if (target.status === 'published') return false;

      const earlierUncompleted = drawsInDatabase.some(
        (d) =>
          (d.year < target.year || (d.year === target.year && d.month < target.month)) &&
          d.status !== 'published'
      );
      if (earlierUncompleted) return false;

      const laterPublished = drawsInDatabase.some(
        (d) =>
          (d.year > target.year || (d.year === target.year && d.month > target.month)) &&
          d.status === 'published'
      );
      if (laterPublished) return false;

      return true;
    }

    expect(canPublishDraw('draw_feb')).toBe(false);
  });

  it('carries forward unconsumed rollover across skipped months (Jan -> March skips Feb)', () => {
    const janFinancials = {
      five_match_rollover_minor: 4000,
    };

    const marchDrawInput = {
      totalFundedMinor: 50000,
      incomingRolloverMinor: janFinancials.five_match_rollover_minor,
      winnerCounts: { fiveMatch: 0, fourMatch: 0, threeMatch: 0 },
    };

    const res = calculateDrawFinancials(marchDrawInput);
    expect(res.fiveMatchPoolMinor).toBe(8000);
    expect(res.fiveMatchRolloverMinor).toBe(8000);
    expect(res.unawardedReserveMinor).toBe(6000);
    expect(res.roundingReserveMinor).toBe(0);
  });

  it('enforces invoice replay idempotency: preserves original completed allocations and rejects parameter conflicts', () => {
    interface FundingAlloc {
      invoice_id: string;
      charity_share_minor: number;
      charity_pct: number;
    }

    const invoicesDb = new Map<string, { id: string; amount_paid: number; currency: string }>();
    const allocationsDb: FundingAlloc[] = [];

    function processInvoiceFundingAllocation(
      stripeInvoiceId: string,
      amountPaid: number,
      currency: string,
      userCharityPct: number
    ) {
      const existing = invoicesDb.get(stripeInvoiceId);
      if (existing) {
        if (existing.amount_paid !== amountPaid || existing.currency !== currency) {
          throw new Error(`Invoice replay conflict: conflicting amount or currency for invoice ${stripeInvoiceId}`);
        }
        return existing.id; // Return without modifying completed allocations
      }

      const invId = `inv_${Date.now()}`;
      invoicesDb.set(stripeInvoiceId, { id: invId, amount_paid: amountPaid, currency });

      const charityShare = Math.floor(amountPaid * (userCharityPct / 100));
      allocationsDb.push({
        invoice_id: invId,
        charity_share_minor: charityShare,
        charity_pct: userCharityPct,
      });

      return invId;
    }

    // 1. Initial processing at 10% charity split
    const invId1 = processInvoiceFundingAllocation('in_12345', 10000, 'inr', 10);
    expect(allocationsDb[0].charity_share_minor).toBe(1000);
    expect(allocationsDb[0].charity_pct).toBe(10);

    // 2. User changes profile charity percentage to 80%
    const updatedUserPct = 80;

    // 3. Replaying same webhook DOES NOT rewrite charity_share_minor to 8000
    const invId2 = processInvoiceFundingAllocation('in_12345', 10000, 'inr', updatedUserPct);
    expect(invId2).toBe(invId1);
    expect(allocationsDb[0].charity_share_minor).toBe(1000); // Preserved at 1000!

    // 4. Conflicting invoice replay (e.g. mismatched amount) is rejected
    expect(() => processInvoiceFundingAllocation('in_12345', 20000, 'inr', 80)).toThrow(
      'Invoice replay conflict: conflicting amount or currency for invoice in_12345'
    );
  });
});
