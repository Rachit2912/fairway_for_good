# Implementation Status — Fairway for Good

This document accurately classifies implemented features, PRD scope compliance, test evidence, and external integration blockers.

## PRD Requirement & Resolution Summary

| Requirement / Scope Item | Status | Implementation Details & Evidence |
| :--- | :--- | :--- |
| **Short-Lived Admin Signed Proof URLs** | **Implemented** | Server action `getWinnerProofSignedUrlAction(storagePath)` in `src/app/actions/adminActions.ts` verifies admin role and generates a 60-second short-lived signed URL for `winner-proofs` bucket images prior to approval. Connected in `AdminWinnersClient`. |
| **Seed Script Password Enforcement** | **Implemented** | `src/scripts/seed.ts` removed fallback default passwords. Aborts execution with a clear error if `TEST_ADMIN_PASSWORD` or `TEST_USER_PASSWORD` are missing. |
| **Direct Table Write Revocation** | **Implemented** | Direct `INSERT`/`UPDATE`/`DELETE` permissions on `scores`, `draw_financials`, and `draw_awards` are revoked from `authenticated`. All mutations execute through security-definer procedures (`save_user_score`, `lock_monthly_draw`, `publish_monthly_draw`). |
| **Chronological Draw Publication Guard** | **Implemented** | `publish_monthly_draw` enforces that no earlier month's draw remains in draft/locked/generated status, and no later month's draw is already published (rejecting out-of-order publication). Verified in `src/lib/drawLifecycle.test.ts`. |
| **Paid-Through Subscription Eligibility** | **Implemented** | `lock_monthly_draw` requires `sub.current_period_end IS NOT NULL AND sub.current_period_end >= NOW()`. |
| **Atomic Webhook Allocation RPC** | **Implemented** | `process_invoice_funding_allocation` RPC executes invoice creation and funding allocation upserts in a single transaction. Allocations linked to locked draws (`draw_id IS NOT NULL`) are frozen and preserved. |
| **Invoice Replay Idempotency** | **Implemented** | `process_invoice_funding_allocation` returns existing invoice IDs without modifying completed allocations or charity split snapshots, and rejects conflicting replay parameters. Verified in `src/lib/drawLifecycle.test.ts`. |

---

## Honest Scope Status & Missing/Blocked Items
1. **Automated Bank Payout Discursions**: As required by the assignment brief, no real-money bank transfers are performed. Admin payout marking updates internal database bookkeeping states (`payouts` table).
2. **Supabase Live Provisioning**: Production execution of SQL migrations against a live Postgres database requires the owner to create a new Supabase project and populate live credentials.
3. **Stripe Test Mode Webhooks**: Real test-mode webhooks require forwarding via Stripe CLI and setting `STRIPE_WEBHOOK_SECRET` in environment variables.

---

## Verification Evidence
- **Vitest Unit & Integration Suite**: 24/24 PASSED (`npm test`)
- **ESLint**: 0 errors (`npm run lint`)
- **Next.js Production Build**: PASSED (`npm run build`)
