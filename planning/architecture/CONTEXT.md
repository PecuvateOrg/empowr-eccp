# Architecture

This area records ECCP's system design, data ownership, request lifecycles, and integration boundaries.

## Baseline

- Frontend and application layer: Next.js App Router with TypeScript
- Styling: Tailwind CSS 4 with Empowr brand tokens
- Hosting: Netlify with repository base directory `src/`
- Package management: pnpm 11.22.0 on Node 22

## Request Lifecycle

The initial scaffold renders public programme orientation only. Authenticated learning, assessment, administration, and certification lifecycles are intentionally undefined until the product scope and service boundaries are confirmed.

## Open Architecture Decisions

- Identity provider and whether ECCP shares or separates member identity
- Database ownership and isolation from other Empowr applications
- Learning-content authoring and delivery model
- Evidence upload, retention, access control, and deletion
- Assessment workflow and certificate issuance
- Email and notification delivery

## Constraints

- Netlify can access runtime files only inside `src/` because that is the base directory.
- Any shared service must positively identify ECCP-owned data and events.
- The shared `empowr-cic` Supabase Auth namespace is owned by Members; reuse requires an explicit decision.
