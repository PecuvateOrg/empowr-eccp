# Empowr ECCP

Empowr Certified Coaching Programme — the web platform for Empowr's member-to-coach certification pathway.

@NON-NEGOTIABLES.md

Other tools: read `NON-NEGOTIABLES.md` first, then `~/projects/NON-NEGOTIABLES.md`.

## Routing

| Task | Go to | Read | Skills |
|---|---|---|---|
| **Design: look, colours, components** | `design-system/` | `design-system/MASTER.md` (then the Empowr brand kit it names) | — |
| Feature specification or architecture | `planning/` | `CONTEXT.md` | — |
| UI, routes, components, or application code | `src/` | `CONTEXT.md` | `/webapp-testing` |
| Deployment or going live | `ops/` | `CONTEXT.md` | `/netlify-deploy`, `/netlify-supabase-check` |
| Brand or favicon setup | `ops/` | `CONTEXT.md` | `/init-brand` |

## Cross-Workspace Flows

- Feature delivery: `planning/spec/` → `planning/architecture/` → `src/` → `ops/`

## File Placement

- Product requirements and acceptance criteria → `planning/spec/`
- Architecture and technical decisions → `planning/architecture/` and `planning/decisions/`
- Next.js application and runtime assets → `src/`
- Deployment and operational documentation → `ops/`

## Public Repository Documents

- Private operational documents live at `../workspace-docs/empowr-eccp/DEVLOG.md` and `../workspace-docs/empowr-eccp/memory.md`. See `NON-NEGOTIABLES.md` for what must never be committed here.

## Deployment

- Platform: AWS Amplify, London (eu-west-2), since 2026-11-18. The Netlify site is a fallback until it is retired
- Scheduled jobs: renewal reminders via AWS EventBridge → `POST /api/cron/renewal-reminders` (08:00 UTC)
- Domain: eccp.empowrcic.org
- Branch: main
- Base directory: src/

## Facts

- Read the Empowr CIC KB only for programme facts, terminology, or public copy.
