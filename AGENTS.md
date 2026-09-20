# Agent instructions

This repository is the Fairway for Good selection-assignment project.
Read docs/IMPLEMENTATION_BRIEF.md completely before changing application code.
It contains the available PRD scope, explicitly labeled assumptions, architecture, design, phases and acceptance checks.
Read docs/JULES_START.md for the initial task.

## Working agreement
- Implement the project, not just a roadmap or visual prototype. Follow the sequential phases, committing each coherent phase.
- Work on a feature branch and deliver a reviewable PR; do not merge your own work.
- Preserve documented requirements. Record any necessary new assumption in the brief and implementation status.
- Make routine implementation decisions independently. Do not wait for the owner for colors, component choice or file naming.
- Missing third-party credentials do not block writing correct integration code, migrations, tests and setup documentation. Record which live checks remain blocked.
- Never invent successful deployment, test results, screenshots, payments or credentials.
- Keep production code connected to Supabase. Mocks belong in tests; demo data must be visibly identified.
- No real-money transactions or purchases. Stripe integration is test mode.
- Never weaken auth/RLS or add a public admin/entitlement bypass to make the demo work.
- No secrets in commits, logs, client bundles, public env vars, screenshots or PR text.
- Keep domain calculations testable and independent of UI. Use database transactions and constraints for concurrency-sensitive rules.
- Follow official documentation matching the installed dependency versions; commit the lockfile.
- Maintain docs/IMPLEMENTATION_STATUS.md with evidence and external blockers.
- Final handoff must list implemented features, tests actually run, remaining blockers and exact owner setup steps.
