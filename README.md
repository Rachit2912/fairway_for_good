# Fairway for Good — Selection Assignment Build

Fairway for Good is a community subscription web application combining golf Stableford score tracking, monthly number-based prize draws, and transparent charitable contributions.

## Key Features Implemented
- **Public & Marketing Pages**: Homepage with transparent funding breakdown, How It Works, Pricing plans (INR 999/mo & INR 9,990/yr), Charity Directory, and Draw Results.
- **Member Dashboard**: Score management retaining the 5 greatest round dates (1-45 integers), charity split selection (10%-80%), Stripe billing management, draw history, and winning proof uploads.
- **Admin Suite**: User management, charity CRUD, monthly draw lifecycle (simulation, locking, cryptographic generation, publication), winner proof screenshot approval, and financial reports.
- **Draw Engine & Math**: Exact multiset matching (`sum(min(entry_count, draw_count))`), fixed 20% prize pool distribution across 5-match (40%), 4-match (35%), and 3-match (25%) tiers, integer minor unit precision with zero money lost, and 5-match jackpot rollover.
- **Stripe Integration**: Test mode webhooks with signature verification, raw body parsing, idempotent invoice tracking, and 12-month annual allocation distribution.

## Architecture & Technology Stack
- **Framework**: Next.js 16 (App Router) with TypeScript & Tailwind CSS
- **Database & Auth**: Supabase Postgres with SSR Auth and RLS Policies
- **Payment Processor**: Stripe SDK (Test Mode Webhook Endpoint)
- **Testing**: Vitest unit suite & Playwright E2E verification

## Setup Instructions for Owner

### 1. Supabase Project Setup
1. Create a new Supabase project on [supabase.com](https://supabase.com).
2. Execute the database migration file located in `supabase/migrations/20260101000000_initial_schema.sql` via Supabase SQL Editor.
3. Configure authentication redirect URLs in Supabase Auth settings to match your domain.

### 2. Environment Variables Configuration
Copy `.env.example` to `.env.local` and fill in the live keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_...

TEST_ADMIN_EMAIL=admin@fairwayforgood.org
TEST_ADMIN_PASSWORD=AdminPassword123!
TEST_USER_EMAIL=member@fairwayforgood.org
TEST_USER_PASSWORD=MemberPassword123!
```

### 3. Database Seeding
Run the seed script to create initial sample charities, events, and admin/member test accounts:
```bash
npm run seed
```

### 4. Running Tests & Build
```bash
# Run unit test suite
npm test

# Run Next.js production build
npm run build
```
