# Fairway for Good — Selection Assignment Build

Fairway for Good is a community subscription web application combining golf Stableford score tracking, monthly number-based prize draws, and transparent charitable contributions.

## Key Features Implemented
- **Public & Marketing Pages**: Homepage with transparent funding breakdown, How It Works, Pricing plans (INR 999/mo & INR 9,990/yr), Charity Directory, and Draw Results.
- **Member Dashboard**: Score management retaining the 5 greatest round dates (1–45 integers), charity split selection (10%–80%), Stripe billing management, draw history, and winning proof uploads.
- **Admin Suite**: User management, charity CRUD, monthly draw lifecycle (dry-run simulation, locking, cryptographic generation, publication), winner proof screenshot approval, short-lived signed proof URL generation, and financial reports.
- **Draw Engine & Math**: Exact multiset matching (`sum(min(entry_count, draw_count))`), fixed 20% prize pool distribution across 5-match (40%), 4-match (35%), and 3-match (25%) tiers, integer minor unit precision with zero money lost, and 5-match jackpot rollover carried forward across skipped months.
- **Stripe Integration**: Test mode webhooks with signature verification, raw body parsing, idempotent invoice tracking, independent one-time charity donations, and 12-month annual allocation distribution.

---

## Detailed Setup Instructions for Owner

### 1. Supabase Postgres & Storage Provisioning
1. Create a new project on [supabase.com](https://supabase.com).
2. Open the SQL Editor and execute all migration files in order:
   - `supabase/migrations/20260101000000_initial_schema.sql`
   - `supabase/migrations/20260102000000_security_and_draw_lifecycle.sql`
   - `supabase/migrations/20260103000000_cleanup_legacy_score_rpc.sql`
   - `supabase/migrations/20260104000000_draw_lifecycle_awards.sql`
   - `supabase/migrations/20260105000000_draw_lifecycle_strict_rollover.sql`
   - `supabase/migrations/20260106000000_strict_chronological_rollover_and_paid_period.sql`
   - `supabase/migrations/20260107000000_atomic_webhook_and_rollover_preservation.sql`
   - `supabase/migrations/20260108000000_fk_and_payout_security.sql`
   - `supabase/migrations/20260109000000_grant_generate_monthly_draw_service_role.sql`
   - `supabase/migrations/20260110000000_hardened_draw_lifecycle_and_subscription_security.sql`
   - `supabase/migrations/20260111000000_admin_role_rpc_and_audit.sql`
3. Create a private storage bucket named `winner-proofs` in Supabase Storage. Ensure public access is disabled.
4. In Supabase Authentication settings, add your deployment domain URL to Site URL and Redirect URLs.

### 2. Stripe Test Mode Product & Webhook Configuration
1. In the Stripe Dashboard (Test Mode), create two subscription Products with recurring prices:
   - Monthly Membership: INR 999.00 / month
   - Annual Membership: INR 9,990.00 / year
2. Configure a Webhook Endpoint pointing to `https://your-domain.com/api/webhooks/stripe` with the following event subscriptions:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 3. Environment Variables Configuration
Copy `.env.example` to `.env.local` and populate keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_monthly...
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_annual...

NEXT_PUBLIC_APP_URL=http://localhost:3000

TEST_ADMIN_EMAIL=admin@fairwayforgood.org
TEST_ADMIN_PASSWORD=YOUR_UNMISTAKABLE_ADMIN_PASSWORD_PLACEHOLDER
TEST_USER_EMAIL=member@fairwayforgood.org
TEST_USER_PASSWORD=YOUR_UNMISTAKABLE_MEMBER_PASSWORD_PLACEHOLDER
```

### 4. Database Seeding
Execute the seed script to create initial charities, events, and admin/member user accounts:
```bash
npm run seed
```

### 5. Running Tests & Production Build
```bash
# Run Vitest test suite (32 passing unit/integration tests)
npm test

# Run ESLint check
npm run lint

# Compile Next.js production build
npm run build
```
