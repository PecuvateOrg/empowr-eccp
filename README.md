# Empowr ECCP

## About

### What it is
The platform for the Empowr Certified Coaching Programme, at eccp.empowrcic.org.

### What it's for
To give members a clear pathway to becoming a certified coach, and give Empowr a reliable record of who is trained, in what, and when.

### How it works
1. Staff add a coach by email; the coach signs in with a one-time code sent to them.
2. The coach works through a course module by module, with their progress saved.
3. Each course ends in a scored assessment.
4. Passing it issues a certificate the coach can download, with its own number (for example ECCP-SG-2026-001).
5. Staff follow every coach's progress from the management area.

The pathway has four courses: Safeguarding is live; Code of Conduct, Head Coach First Aid and Safe Session Delivery are coming.

The web platform for the Empowr Certified Coaching Programme, supporting the pathway from Empowr member to certified coach.

## Setup

Run commands from `src/`:

```sh
corepack pnpm install
corepack pnpm dev
```

## Quality Checks

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

## Environment Variables

No runtime environment variables are required by the initial scaffold. Add variable names to `src/.env.example` before introducing an integration.

Copy `.env.example` to `.env.local` when environment variables are introduced. Never commit `.env.local`.

## Deployment

- Platform: **AWS Amplify, London (eu-west-2), since 2026-11-18**. Pushing to `main` deploys.
- Build: `amplify.yml` at the repo root (pnpm, Node 22, base directory `src/`)
- Domain: `eccp.empowrcic.org`
- Secrets: AWS SSM, written to `.env.production` at build. There are no Netlify environment variables any more.
- Background work: certificates are issued inside the request (`ECCP_INLINE_ISSUANCE=1`). Renewal reminders run daily at 08:00 UTC from AWS EventBridge via `POST /api/cron/renewal-reminders`.
- The Netlify site, `netlify.toml` and `src/netlify/` are a fallback only, to be removed about 2026-12-02. Do not add new Netlify functions or Netlify-only environment variables.

See `CLAUDE.md` and `ops/CONTEXT.md` for full project and deployment guidance.
