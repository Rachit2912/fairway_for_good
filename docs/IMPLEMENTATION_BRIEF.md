# Fairway for Good — implementation brief

Status: implementation specification, not a completed application.
Target: a complete demonstrable selection-assignment build in approximately 48 hours.
Repository: Rachit2912/fairway_for_good.
Product source: user-supplied Digital Heroes PRD (Level 1), version 1.0, March 2026.
The supplied PDF has 13 physical pages; printed page 11 (technical requirements and scalability) is absent. Do not claim those missing sections were reviewed.
The requirements below paraphrase the available PRD; proposed assumptions are explicitly separated.

## 1. Required product scope

Build a subscription website combining golf Stableford scores, monthly prize draws, and charitable contributions. Public visitors can understand the concept, browse/search/filter charities, inspect profiles and events, view how draws work, and subscribe. Registered members have profile/settings, charity preferences, score management, participation history, winnings, and proof uploads. Administrators manage users, subscriptions, scores, charities/media, draws, winner verification, payouts, and reports.

Required:
- Monthly and discounted annual subscriptions through Stripe or an equivalent provider; renewal, cancellation, lapse, and current access checks.
- Latest five scores, integer 1–45, each with a date; unique date per user; newest first; automatic oldest replacement; edit/delete.
- Monthly five-number draw with 5-, 4-, and 3-match reward tiers. Random and score-frequency-weighted modes, simulation, controlled publication.
- Fixed subscription portion to prizes; tier distribution 40% / 35% / 25%, equal division within each tier, jackpot rollover.
- Charity selected at signup, minimum 10% of subscription, voluntary increase; independent donations.
- Charity directory with search/filter, detail description/images/upcoming events, homepage featured charity.
- User dashboard: subscription status/renewal, five scores, charity/percentage, past/upcoming participation, total winnings and payment state.
- Admin: profile and score edits, subscription management, draw configuration/simulation/publication, charity CRUD/media, proof approve/reject, payout completion.
- Winner-only screenshot proof upload, admin verification, pending/paid payout status.
- Analytics: user totals, prize pools, charity totals, draw statistics.
- Modern responsive motion-enhanced design led by charitable impact, prominent subscription CTA, no traditional golf visual clichés.
- Functional deployed URL, test user/admin credentials delivered privately, connected backend/database, clean source.
- Deployment explicitly requires a NEW Vercel account and NEW Supabase project. Account creation, secrets and private credentials remain owner setup tasks.

## 2. Proposed assignment assumptions

These are implementation defaults selected to resolve gaps, NOT statements from the PRD. Keep them visible in README and relevant product explanations; change only with a documented reason.

### Scores and eligibility
- Use UTC for monthly boundaries and draw timestamps; store round dates as date-only values.
- Dates cannot be in the future. Same numeric value on different dates is allowed.
- Retain the five greatest round dates, not the five latest submission timestamps. When full, reject a new backdated score older than the current oldest with a clear explanation; editing an existing stored score is allowed.
- Serialize score mutations per user in a database transaction; enforce unique(user_id, round_date). Reject invalid edits without partial changes.
- Non-subscribers can view their account/history, update profile/charity, subscribe and submit proof for an already won prize. New score mutations require current active access.
- One entry per eligible user per monthly draw, with exactly five saved scores and a paid active subscription when entries lock.
- A canceled subscription remains eligible until the paid-through period ends. Past-due/unpaid/incomplete subscriptions are ineligible.
- MVP draws use an explicit admin lock action once per calendar month. The lock timestamp is the actual eligibility cutoff, clearly shown to users. Do not pretend to reconstruct past eligibility or scores if an admin missed a month.
- Lock entry score values, dates, subscription coverage and funding amounts into immutable snapshots. Later edits or cancellation do not rewrite history.

### Draw math and lifecycle
- Generate five integers from 1 through 45 WITH replacement; duplicates are allowed in both draw and score arrays. This is an explicit assumption to let repeated scores participate naturally.
- Matching is multiset intersection: sum(min(entry_count[value], draw_count[value])). Order is irrelevant.
- Example: entry [10,10,20,30,40], draw [10,20,20,30,45] = 3 matches.
- Award only the highest matching tier; 0–2 matches earn nothing.
- Random mode: uniform independent samples using server-side cryptographically secure randomness.
- Weighted mode: each value's weight = 1 + its occurrence count across locked eligible score snapshots. Sample each of five slots with replacement from these weights. Store algorithm version and histogram. Never claim this is uniform or increases every user's odds.
- Simulation is dry-run only: produces previews with no financial writes, entries, winners or rollovers. Use deterministic RNG injection in tests, never a public controllable seed for final draws.
- State flow: draft -> locked -> generated -> published. One monthly draw, one official result per draw. Lock freezes config and entries; official generation happens once; publishing reveals those stored numbers without rerolling.
- Simulation is allowed before generation. Label previews clearly. No arbitrary manual override of official numbers, and no reroll button after generation.
- Database transaction/locks and unique constraints prevent double lock, generation, publication, allocation and payout under retries/concurrent requests.
- Finalization persists snapshots, tier amounts, awards, audit record and rollover exactly once. Public output contains no proof images or private user data.

### Funding and accounting
- Demonstration defaults: INR 999 monthly and INR 9,990 annually. Currency and prices are server-owned configuration, matched to provider Price IDs. No live payments.
- Allocate 20% of each funded monthly share to prizes; this value is not specified by the PRD.
- Annual payment is allocated over 12 coverage months in minor currency units. Distribute any remainder deterministically so the 12 shares sum exactly to the payment. Monthly invoices fund one coverage month.
- Deduplicate successful invoices and donation payments by provider identifiers. Track coverage-month allocations so an annual invoice is never counted 12 times at full value.
- At monthly lock, include at most one funded coverage allocation per active member, irrespective of whether that member has five scores. Thus the pool uses active funded subscriber count; entrants are a subset.
- Prevent a coverage allocation being used by more than one draw. Unused funds remain separately tracked, not quietly recognized as profit or reused as jackpot.
- Snapshot selected charity and charity percentage when a successful invoice is allocated. User changes affect the next invoice; existing annual allocations retain their original charity split.
- Charity percentage 10–80% inclusive, integer increments; 80% cap reserves the fixed 20% prize share. The cap is an assumption arising from the chosen funding model; disclose it in the UI and documentation.
- Platform remainder = subscription allocation minus prize and charity allocations. Show donation receipts separately; donations never buy draw entries.
- All arithmetic uses integer minor units. Never use floating point money.
- For base pool P: five tier floor(40P/100), four tier floor(35P/100), three tier receives the remainder. Add incoming jackpot rollover ONLY to five tier.
- Split a tier equally in minor units; any sub-unit-of-equal-share residue remains in a separate rounding reserve. Example: 3500 minor units / 3 winners = 1166 each + 2 reserve.
- If no five-match winners, roll its whole amount (including incoming jackpot) into the next monthly draw. Four/three tiers with no winners become explicitly reported unawarded reserves; no rollover and no redistribution.
- For this assignment, “unclaimed jackpot” means zero five-match winners at publication. Unverified/unsubmitted awards remain pending liabilities; do not silently reallocate them. A claims-expiry policy is outside the supplied specification.
- Refunds/disputes received before lock invalidate the relevant funding/eligibility; after publication flag for admin reconciliation without rewriting published awards. Document this limited manual handling.
- Charity totals mean allocated contributions, not proof of external charity disbursement. Winnings marked paid are manual bookkeeping, not automated bank transfers.

### Payments, access and proof
- Implement actual provider TEST-mode checkout, webhook handling and billing portal integration. Successful return-page navigation does not activate subscriptions.
- Verify webhook signature against raw request body, persist unique event ID, apply updates idempotently and defend against out-of-order events (retrieve current provider state when needed).
- Check authenticated identity and fresh database entitlement on every authenticated server request; refresh provider state when stale/uncertain. Clearly document that a webhook-maintained DB check is the chosen interpretation of “real-time,” not a provider API call for every asset.
- Fail closed for subscriber-only operations when entitlement cannot be established; retain login, billing recovery, history and existing-winner proof access.
- Admin subscription controls must act through the provider or refresh provider state; no unaudited fake active checkbox.
- Winner proof: private JPEG/PNG/WebP screenshot, max 5 MB, validated type/content, winner ownership check, random storage path, short-lived signed admin URL.
- Verification states: pending/approved/rejected with reason, reviewer and timestamp; allow corrected resubmission. Payout states separate: pending/paid. Cannot mark paid before approval or mark twice. Record reference, actor, date and amount. Never solicit bank details for this demo.
- Inactive former subscribers can still claim previously awarded prizes.

## 3. Architecture proposal

Use one TypeScript Next.js App Router application on Vercel, Supabase Postgres/Auth/Storage, Stripe test mode, Tailwind CSS and accessible reusable UI components. Use current mutually compatible stable releases and commit the lockfile; avoid beta dependencies. No separate Express service, microservices, Redis, message broker or custom auth for this deadline.

Use server-only domain services for score retention, eligibility, draw/matching, money allocation and publishing. Keep pure calculations independent from React and external services. Use Postgres transactional functions where multiple tables must change atomically. Route handlers/server actions authenticate, validate, authorize and call these services. RLS is defense in depth, not a substitute for server authorization.

Proposed entities:
- profiles: auth user FK, display name, current charity and percentage; role stored in protected role table/column.
- charities and charity_events: slug, description, category, image references, featured/active flags; archive referenced charities instead of destroying historical relationships.
- subscriptions: user/provider IDs, plan, status, period coverage, cancel-at-end, last reconciliation timestamp.
- payment_events / invoices: unique provider IDs and processing state; do not retain unnecessary payment payload data.
- funding_allocations: invoice, user, coverage interval, minor amounts, charity snapshot, draw consumption reference.
- scores: owner, round_date, value; unique owner/date and constraints.
- draws: unique calendar month, mode, status, lock time, official numbers, algorithm version, histogram/config snapshots.
- draw_entries: unique draw/user, five values and dates snapshot, eligibility evidence.
- draw_financials / awards: tier allocations, carry/reserves; unique draw/user award and nonnegative amounts.
- winner_submissions: award, private path, version, review state/reason.
- payouts: unique award, pending/paid, actor/reference/date.
- donations: user nullable if guest checkout supported, charity, provider ID, amount/status.
- audit_logs: actor, action, target, timestamp, minimal change details; no secrets.

Index owner/date, draw/status/month, subscription owner/provider ID, and financial provider IDs. Add foreign keys/checks/uniques. Enable RLS on exposed tables, ownership policies on user data, admin-only mutations and private storage policies. Users must not edit role, entitlement, money or draw state using the Supabase client. Restrict any SECURITY DEFINER functions, fix search_path and validate caller/role.

No authenticated page caching across users; no secrets in NEXT_PUBLIC variables, client bundles, logs, fixtures, commits, or screenshots. Test-user/admin passwords are supplied through private environment variables for an idempotent seed script.

## 4. Design and route map

Brand: Fairway for Good. Tone: warm, confident, community-first.
Visual proposal: warm ivory background, dark ink typography, deep teal surfaces, restrained coral/lime accents; large editorial headings, generous space and meaningful charity imagery. Avoid golf-course hero photos, plaid, generic neon dashboards and unearned financial claims.
Homepage concept: “Your next round can do more.” Explain record five scores -> join monthly draw -> support your chosen cause. Show real or clearly marked demo data, featured cause, transparent prize/charity split, monthly/yearly prices, FAQ and prominent CTA.
No fabricated testimonials, impact counters presented as real, charity partnerships or promises of winning.

Public routes: /, /how-it-works, /pricing, /charities, /charities/[slug], /draws, /draws/[id], /login, /signup.
Member routes: /dashboard, /dashboard/scores, /dashboard/charity, /dashboard/billing, /dashboard/draws, /dashboard/winnings, /dashboard/settings.
Admin routes: /admin, /admin/users, /admin/users/[id], /admin/draws, /admin/draws/[id], /admin/charities, /admin/winners, /admin/reports.
Equivalent simpler route structures are acceptable if every operation is reachable.

Design mobile first; 360px screens through desktop. Keyboard navigation, visible focus, labels, accessible error messages, sufficient contrast, reduced-motion support, confirmation for consequential admin actions. Include loading, empty, validation, denied-access and service-error states. Label demo payments/data appropriately. Persist real application data in Supabase, never localStorage as the backend.

## 5. Sequential implementation phases

Work on one feature branch and open a reviewable PR. Commit completed phases separately. Do not stop after a plan or scaffold. If an external credential is missing, finish code, migrations, tests and setup documentation, then report the precise external blocker without fabricating live verification.

1. Foundation: app/tooling, design tokens/layout, schema/migrations/RLS, auth, roles, public charity pages, idempotent seed setup and env template.
   Gate: build/typecheck succeed; authenticated ownership/admin denial verified; signup has charity preference.
2. Member flow: payment checkout/webhook/portal, access guards, transactional score CRUD/retention, charity settings, member dashboard.
   Gate: real test-payment integration when credentials available; pure/integration tests otherwise with live verification explicitly blocked.
3. Draw engine: finance allocations, admin configs, simulation, lock/generate/publish, multiset matching, awards/rollover, member/public history.
   Gate: deterministic test vectors, concurrency/retry tests and immutable snapshots.
4. Completion: private proof, verification and payout workflow, admin users/subscriptions/charity media/events, independent donations, accurate reports.
   Gate: entire winner flow and all role boundaries exercised.
5. Delivery: responsive polish, empty/error states, full acceptance review, setup/deployment instructions, CI and demo walkthrough.
   Gate: every requirement mapped to implementation and evidence; no placeholders represented as complete.

## 6. Required verification evidence

Use a compact meaningful test suite (e.g. Vitest plus Playwright and database integration tests), not tests mirroring implementation.
- Scores: range, noninteger, future date, duplicate date, repeated values on different dates, sixth score retention, out-of-order entry, date edit collision, deletion, concurrent inserts, unauthorized edit.
- Match example above = 3; identical multisets = 5; four = only four-tier award; zero eligible participants; seeded weighted test and value range.
- P=10000 -> 4000/3500/2500; incoming rollover only changes five tier; zero winners; multiple winners; rounding conservation.
- Annual allocations sum to paid invoice; two invoices do not duplicate one coverage month; canceled-at-end vs expired; insufficient scores excluded from entries.
- Simulate has zero financial side effects; concurrent publish and webhook retry cannot duplicate winners/money.
- Published entry stays unchanged after a score edit; repeated generation cannot reroll.
- Checkout return cannot grant entitlement; invalid webhook signature rejected; out-of-order subscription events do not reactivate expired access.
- User A cannot read/update B, elevate role, modify subscriptions or invoke admin RPCs; anon cannot read proof; oversize/wrong-file proof rejected.
- Proof approved before paid; repeated payout idempotent; rejection/resubmission works; inactive existing winner can upload.
- Signup -> test subscription -> five scores -> draw -> proof -> admin approval -> marked paid, plus separate donation.
- Mobile/desktop screenshots and keyboard journey. Never report live integration tests as passed using mocks alone.

## 7. Delivery and owner setup

Provide README with commands, prerequisites, architecture, assumptions, feature checklist, exact env keys, migrations/seeding, local webhook forwarding, provider test setup, Supabase auth redirect/storage settings, deployment, demo walkthrough and limitations.
Provide .env.example placeholders only, migrations, private-credential seed script, lockfile, lint/typecheck/test/build scripts, CI, and docs/IMPLEMENTATION_STATUS.md with completed/blocked/not-started statuses.
Demo data may include fictitious charities/events clearly identified as samples; use original or properly licensed assets with attribution where required.
New Supabase project and new Vercel account are mandatory owner provisioning steps. Configure secrets there, test provider webhooks against final deployment, and deliver credentials privately, not in public README or PR.
Do not claim the site is deployed until its real URL is reachable and smoke-tested. Do not buy services, create live payment transactions, or enable live payouts.

Official implementation references, checked while preparing this brief:
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs
- Stripe webhooks: https://docs.stripe.com/webhooks
- Jules setup and repository instructions: https://jules.google/docs/

The PRD remains the source of requirements. This brief makes missing rules explicit; it does not silently turn assumptions into original requirements.
