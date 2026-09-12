# Empowr ECCP

Empowr Certified Coaching Programme — the web platform for Empowr's member-to-coach certification pathway.

This file is the map. Workspace detail lives in each `CONTEXT.md`.

## Routing

| Task | Go to | Read | Skills |
|---|---|---|---|
| Feature specification or architecture | `planning/` | `CONTEXT.md` | — |
| UI, routes, components, or application code | `src/` | `CONTEXT.md` | `/webapp-testing` |
| Deployment or going live | `ops/` | `CONTEXT.md` | `/netlify-deploy`, `/netlify-supabase-check` |
| Brand or favicon setup | `ops/` | `CONTEXT.md` | `/init-brand` |

## Cross-Workspace Flows

- Feature delivery: `planning/spec/` → `planning/architecture/` → `src/` → `ops/`

## Naming Conventions

- Components: PascalCase (`CertificationCard.tsx`)
- Route segments and utilities: kebab-case
- Decision records: `YYYY-MM-DD-decision-title.md`

## File Placement

- Product requirements and acceptance criteria → `planning/spec/`
- Architecture and technical decisions → `planning/architecture/` and `planning/decisions/`
- Next.js application and runtime assets → `src/`
- Deployment and operational documentation → `ops/`

## Token Management

- Do not load `planning/` unless the task involves scope, architecture, or a decision.
- Do not load Empowr brand references unless the task changes UI or visual assets.
- Read the Empowr CIC KB only for programme facts, terminology, or public copy.

## Public Repository Documents

- Private operational documents live at `../workspace-docs/empowr-eccp/DEVLOG.md` and `../workspace-docs/empowr-eccp/memory.md`.
- Never create or commit `DEVLOG.md` or `memory.md` in this public repository.

## Deployment

- Platform: Netlify
- Domain: <!-- assign before /netlify-deploy -->
- Branch: main
- Base directory: src/

## Skills and Tools

- `/netlify-deploy` — deploy to Netlify and wire up a custom domain
- `/netlify-supabase-check` — audit Netlify and Supabase integration before going live
- `/webapp-testing` — test UI in a browser with Playwright
- `/init-brand` — set up favicons, manifest, and brand assets
- `/ses-email` — wire up transactional email through AWS SES
- `/esign` — route to the appropriate e-signature integration
- `/audit-mwp` — check MWP structure compliance
- `/update-mwp` — update MWP files as the project evolves
