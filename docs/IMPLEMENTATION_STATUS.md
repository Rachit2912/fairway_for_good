# Implementation Status — Fairway for Good

This document accurately classifies implemented features, review status, and external integration blockers.

## Review Resolution Summary

| Review Item | Status | Verification Evidence |
| :--- | :--- | :--- |
| **Rollover Preservation Across Skipped Months** | **Fixed** | Migration `20260107000000_atomic_webhook_and_rollover_preservation.sql` updates `publish_monthly_draw(p_draw_id)` to query the latest published draw prior to `p_draw_id` and carry forward unconsumed 5-match jackpot rollover. Out-of-order publication (Feb after Mar) is rejected. Verified in `src/lib/drawLifecycle.test.ts`. |
| **Atomic Webhook Allocation RPC** | **Fixed** | Created PostgreSQL RPC function `process_invoice_funding_allocation` executing invoice creation and funding allocation upserts in a single database transaction. Funding allocations linked to a draw (`draw_id IS NOT NULL`) are frozen and skipped. Called directly in `src/app/api/webhooks/stripe/route.ts`. |
| **Non-Null Unexpired Paid-Through Eligibility** | **Fixed** | `lock_monthly_draw` requires `sub.current_period_end IS NOT NULL AND sub.current_period_end >= NOW()`. |
| **Table Write Security & Direct Write Revocation** | **Fixed** | Direct `INSERT`/`UPDATE`/`DELETE` permissions on `draw_financials` and `draw_awards` are revoked from `authenticated`. |

---

## Externally Blocked Work
1. **Supabase Live Provisioning**: Production execution of SQL migrations against a live database requires owner creation of a new Supabase project and setting live API keys in environment variables.
2. **Stripe Test Mode Webhooks**: Real test-mode webhooks require forwarding via Stripe CLI and setting `STRIPE_WEBHOOK_SECRET` in environment variables.

---

## Test Evidence
- **Vitest Unit & Integration Suite**: 22/22 PASSED (`npm test`)
- **ESLint**: 0 errors (`npm run lint`)
- **Next.js Production Build**: PASSED (`npm run build`)
