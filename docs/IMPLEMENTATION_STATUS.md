# Implementation Status — Fairway for Good

This document accurately classifies implemented features, review status, and external integration blockers.

## Review Resolution Summary

| Review Item | Status | Verification Evidence |
| :--- | :--- | :--- |
| **Invalid Comment Fix in Migration** | **Fixed** | Fixed line 304 in `20260107000000_atomic_webhook_and_rollover_preservation.sql` replacing invalid `//` with standard SQL `--` comment syntax. |
| **RPC Security Revocation (process_invoice_funding_allocation)** | **Fixed** | Explicitly revoked `EXECUTE` on `process_invoice_funding_allocation` from `PUBLIC`, `anon`, and `authenticated`. Granted `EXECUTE` strictly to `service_role`. Tested in `src/lib/authorization.test.ts`. |
| **Invoice Replay Idempotency & Split Preservation** | **Fixed** | `process_invoice_funding_allocation` checks for existing invoices by `stripe_invoice_id`. If an invoice was previously processed, it returns the existing ID without modifying completed allocations or charity split snapshots, and rejects conflicting replay parameters (`amount_paid` or `currency` mismatch). Tested in `src/lib/drawLifecycle.test.ts`. |
| **Rollover Preservation Across Skipped Months** | **Fixed** | `publish_monthly_draw(p_draw_id)` queries the latest published draw prior to `p_draw_id` and carries forward unconsumed 5-match jackpot rollover. Rejects publication if any later month's draw is already published. |
| **Non-Null Unexpired Paid-Through Eligibility** | **Fixed** | `lock_monthly_draw` requires `sub.current_period_end IS NOT NULL AND sub.current_period_end >= NOW()`. |

---

## Externally Blocked Work
1. **Supabase Live Provisioning**: Production execution of SQL migrations against a live database requires owner creation of a new Supabase project and setting live API keys in environment variables.
2. **Stripe Test Mode Webhooks**: Real test-mode webhooks require forwarding via Stripe CLI and setting `STRIPE_WEBHOOK_SECRET` in environment variables.

---

## Test Evidence
- **Vitest Unit & Integration Suite**: 24/24 PASSED (`npm test`)
- **ESLint**: 0 errors (`npm run lint`)
- **Next.js Production Build**: PASSED (`npm run build`)
