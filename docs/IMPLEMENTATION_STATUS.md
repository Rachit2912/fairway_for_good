# Implementation Status — Fairway for Good

This document accurately classifies implemented features, PRD scope compliance, test evidence, and external integration blockers.

## PRD Requirement & Resolution Summary

| Requirement / Scope Item | Status | Implementation Details & Evidence |
| :--- | :--- | :--- |
| **Database Foreign Keys to Profiles** | **Implemented** | Migration `20260108000000_fk_and_payout_security.sql` adds explicit foreign keys referencing `public.profiles(id)` across `subscriptions`, `user_roles`, `draw_awards`, `scores`, and `winner_submissions`. Verified via PostgREST nested queries in `/admin/users` and `/admin/winners`. |
| **Draw Table Security & Lifecycle Hardening** | **Implemented** | Direct `UPDATE`/`DELETE` on `draws` table revoked from `authenticated`. All status transitions execute through security-definer procedures (`lock_monthly_draw`, `generate_monthly_draw`, `publish_monthly_draw`). |
| **Atomic Idempotent Award Payout Procedure** | **Implemented** | Procedure `process_award_payout(p_award_id, p_reference_note)` locks records, verifies proof scorecard approval, and records payout. Retries return original payout without overwriting original timestamp/actor. Tested in `src/lib/winnerWorkflow.test.ts`. |
| **Draw Engine Dry-Run Simulation** | **Implemented** | `adminSimulateDrawAction` in `src/app/actions/adminActions.ts` runs dry-run preview calculations with zero persistent database mutations. Rendered with explicit preview banner in `AdminDrawDetailClient`. |
| **Independent Stripe Donations** | **Implemented** | `createDonationCheckoutSessionAction` in `src/app/actions/billingActions.ts` creates one-time Stripe checkout sessions. Webhook handler records succeeded donations in `donations` table without granting draw eligibility. |
| **Short-Lived Admin Signed Proof URLs** | **Implemented** | Server action `getWinnerProofSignedUrlAction(storagePath)` in `src/app/actions/adminActions.ts` verifies admin role and generates a 60-second short-lived signed URL for `winner-proofs` bucket images prior to approval. Connected in `AdminWinnersClient`. |
| **Seed Script Password Enforcement** | **Implemented** | `src/scripts/seed.ts` removed fallback default passwords. Aborts execution with a clear error if `TEST_ADMIN_PASSWORD` or `TEST_USER_PASSWORD` are missing. |
| **Controlled Admin Role RPC & Audit Logging** | **Implemented** | Migration `20260111000000_admin_role_rpc_and_audit.sql` creates security-definer function `update_user_role`. Enforces admin privileges, validates input role, prevents revoking sole admin, upserts `user_roles`, and writes `audit_logs`. |
| **Draft & Locked Draw Simulation Logic** | **Implemented** | `adminSimulateDrawAction` groups scores by `round_date DESC`, enforcing active subscription and funded coverage rules for draft draws, and preserving frozen entries for locked draws. |
| **Voluntary Donation Checkout Modal & Disclosures** | **Implemented** | `DonationModal` accepts positive integer minor-unit amounts in INR, displays clear webhook settlement disclosures and draw eligibility disclaimers, and redirects via `createDonationCheckoutSessionAction`. |
| **Admin User & Charity Management UI Workflows** | **Implemented** | Admin suite features `/admin/users/[id]` for profile/score editing and `AdminCharitiesClient` for non-profit and event creation, editing, and status toggles. |

---

## Honest Scope Status & Missing/Blocked Items
1. **Automated Bank Payout Discursions**: As required by the assignment brief, no real-money bank transfers are performed. Admin payout marking updates internal database bookkeeping states (`payouts` table).
2. **Supabase Live Provisioning**: Production execution of SQL migrations against a live Postgres database requires the owner to create a new Supabase project and populate live credentials.
3. **Stripe Test Mode Webhooks**: Real test-mode webhooks require forwarding via Stripe CLI and setting `STRIPE_WEBHOOK_SECRET` in environment variables.

---

## Verification Evidence
- **Vitest Unit & Integration Suite**: 32/32 PASSED (`npm test`)
- **ESLint**: 0 errors (`npm run lint`)
- **Next.js Production Build**: PASSED (`npm run build`)
