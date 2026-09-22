# Implementation Status — Fairway for Good

This document accurately classifies implemented features, review status, and external integration blockers.

## Outstanding Review Items Resolution Summary

| Review Item | Status | Verification Evidence |
| :--- | :--- | :--- |
| **Strict Chronological Publication Guard** | **Fixed** | Migration `20260105000000_draw_lifecycle_strict_rollover.sql` updates `publish_monthly_draw(p_draw_id)` to verify that no earlier month's draw remains in draft/locked/generated status before publishing. Out-of-order test (Jan -> Mar -> Feb) in `src/lib/drawLifecycle.test.ts` passes. |
| **Paid-Through Subscription Eligibility** | **Fixed** | `lock_monthly_draw(p_draw_id)` enforces active paid-through entitlement (`sub.current_period_end >= NOW()`) when linking funding allocations and locking score entries. |
| **Table Write Security & Direct Write Revocation** | **Fixed** | Direct `INSERT`/`UPDATE`/`DELETE` permissions on `draw_financials` and `draw_awards` are revoked from `authenticated`. Financials and awards can only be written via the `publish_monthly_draw` security-definer function. |
| **Webhook Lock Freeze Logic** | **Fixed** | `src/app/api/webhooks/stripe/route.ts` skips overwriting funding allocations if `draw_id IS NOT NULL`, freezing locked draw funds. |
| **Lint Script** | **Fixed** | Updated `package.json` `lint` script to `"eslint ."`. |

---

## Externally Blocked Work
1. **Supabase Live Provisioning**: Production database connection requires owner creation of a new Supabase project and setting live API keys.
2. **Stripe Test Mode Webhooks**: Real test-mode webhooks require forwarding via Stripe CLI and setting `STRIPE_WEBHOOK_SECRET` in environment variables.

---

## Test Evidence
- **Vitest Unit & Integration Suite**: 21/21 PASSED (`npm test`)
- **Next.js Production Build**: PASSED (`npm run build`)
