# Implementation Status — Fairway for Good

This document accurately classifies implemented features, review status, and external integration blockers.

## Review Items Resolution Summary

| Review Item | Status | Verification Evidence |
| :--- | :--- | :--- |
| **Unsafe Score RPC Cleanup** | **Fixed** | Migration `20260103000000_cleanup_legacy_score_rpc.sql` drops 3-parameter function `save_user_score(UUID, DATE, INTEGER)`. Only 2-parameter function checking `auth.uid()` remains. Direct table `INSERT`/`UPDATE` revoked from `authenticated`. |
| **End-to-End Billing Flow** | **Fixed** | Pricing buttons invoke `createCheckoutSessionAction` in `src/app/actions/billingActions.ts`. Validates plan choices, maps to `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` / `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID`, and prevents duplicate active subscriptions. Customer portal linked in member header and billing page. |
| **Draw Engine & Math Conservation** | **Fixed** | `calculateDrawFinancials` in `src/lib/drawEngine.ts` corrected so unawarded 4/3-tier funds are excluded from `roundingReserveMinor`. Conservation regression test (`totalFundedMinor=50000`, 0 winners => base pool 10000, rollover 4000, unawarded 6000, rounding reserve 0) passes in `src/lib/drawEngine.test.ts`. |
| **Transactional Draw Lifecycle** | **Fixed** | Database procedures `lock_monthly_draw`, `generate_monthly_draw`, and `publish_monthly_draw` freeze score snapshots, generate winning numbers without rerolls, and publish results atomically. Connected to `AdminDrawDetailClient` in `/admin/draws/[id]`. |
| **Connected Member & Admin Workflows** | **Fixed** | Auth forms, Score CRUD (`MemberScoresClient`), Charity preferences (`MemberCharityClient`), Winner proof upload (`MemberWinningsClient`), and Admin Winner Review & Payout (`AdminWinnersClient`) are fully wired to Server Actions and Supabase database calls. |
| **Database RLS Authorization Tests** | **Fixed** | Expanded `src/lib/authorization.test.ts` testing direct table write restrictions, winner proof permissions, and role elevation blocks. |

---

## Externally Blocked Work
1. **Supabase Live Provisioning**: Production database connection requires owner creation of a new Supabase project and setting live API keys.
2. **Stripe Test Mode Webhooks**: Real test-mode webhooks require forwarding via Stripe CLI and setting `STRIPE_WEBHOOK_SECRET` in environment variables.

---

## Test Evidence
- **Vitest Unit Suite**: 16/16 PASSED (`npm test`)
- **Next.js Production Build**: PASSED (`npm run build`)
