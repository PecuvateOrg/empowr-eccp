# Empowr ECCP — Project Context

Empowr ECCP is the planned web platform for the Empowr Certified Coaching Programme. It will support the pathway from Empowr member to certified coach across Foundation, Practitioner, and Advanced Coach levels. The initial repository establishes the product, code, and deployment structure; detailed learning journeys, administration, assessment, certification, and access rules remain to be specified with Empowr.

## Workspace Map

| Workspace | Purpose |
|---|---|
| `planning/` | Product scope, architecture, and decision records |
| `src/` | Self-contained Next.js application; run all pnpm commands here |
| `ops/` | Netlify deployment, environment variables, and operational setup |

## Audience

- Empowr members progressing into coaching
- Existing practitioners completing or evidencing certification
- Empowr staff administering cohorts, assessment, and certification

## Source of Truth

Programme identity and terminology come from `F:\Projects\vaults\EMPOWR CIC\entities\eccp.md`. Coaching appointments, responsibilities, and payment are separate from certification and come from the KB's coaching programme delivery framework.

## External Services

- Netlify — intended deployment platform; site and domain are not yet assigned
- Authentication, data storage, payments, email, and learning-content services — not yet selected

## Known Decisions and Constraints

- The repository is public under `PecuvateOrg` so `EmpowrCIC` can contribute through a fork and pull request.
- Private operational state lives in the parent workspace, not this repository.
- Do not assume ECCP can reuse the shared `empowr-cic` Supabase Auth setup: that Auth namespace is already owned by Empowr Members and requires an explicit architecture decision.
- The project uses Next.js App Router, TypeScript strict mode, Tailwind CSS 4, pnpm 11.22.0, and Netlify.
