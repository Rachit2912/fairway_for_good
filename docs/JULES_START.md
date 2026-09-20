# Start this task in Jules

Select Rachit2912/fairway_for_good and the main branch. Paste the prompt below.
Review the proposed plan against the repository brief and start implementation using the controls Jules presents.
If the repo is absent from the selector, the owner must grant Jules access to this repository.
Account authorization is separate from having this repository URL.

## Launch prompt

Implement Fairway for Good in this repository. Read AGENTS.md and docs/IMPLEMENTATION_BRIEF.md in full first. The owner has approximately two days and wants you to implement independently while they are away.

Build the complete application described by the brief using its proposed stack, product rules and design direction. Carry out phases 1–5 sequentially in a single feature branch with phase-sized commits. Do not stop after a scaffold, landing page, implementation plan or mock dashboard. Include actual Supabase migrations/RLS, auth, payment test-mode integrations, score retention, random/weighted monthly draws, prize accounting, charity contributions/donations, user/admin dashboards, private winner proof and payout tracking.

The brief explicitly resolves PRD ambiguities: follow these assumptions and keep them documented. Be especially careful with duplicate-score multiset matching, draw snapshot immutability, annual funding allocation, subscription eligibility, idempotent webhooks and atomic publication.

Use the current stable mutually compatible dependency versions, check official docs and commit the lockfile. Develop and test all work that does not require missing account credentials. Missing secrets should yield explicit setup instructions and blocked live verification, not fake subscription activation or disabled authorization. Do not purchase services, run live payments, expose credentials, or create public privileged demo shortcuts.

Implement the warm, charity-led responsive visual direction in the brief and include accessible loading/empty/error states. Finish with meaningful tests and screenshots if browser tooling is available, run lint/typecheck/test/build, fix failures, and map every PRD feature to evidence in docs/IMPLEMENTATION_STATUS.md.

Open a PR when ready. Its description must explain what works, actual verification performed, remaining gaps and the exact owner steps for the new Supabase project, new Vercel account and test-payment credentials. Leave the PR unmerged for review. If execution limits prevent completing every phase, commit the working progress and provide a precise continuation prompt; do not mark unfinished requirements complete.

## Review when Jules finishes

Share the PR link with the reviewing assistant. Review financial rules, auth/RLS, missing PRD functionality, test evidence, and mobile usability before merging/deploying.

The handoff documents are preparation only. Their existence does not mean Jules has been launched, the application implemented, or deployment completed.
