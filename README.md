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

You need Node 22 or later (CI uses 22) and corepack, which comes with Node. You don't need secrets or a `.env` file to install, run the checks or build. Run commands from `src/`:

```sh
corepack enable          # once per machine; after this, plain `pnpm` works
pnpm install             # also turns on the pre-push hook (.githooks/pre-push)
pnpm dev
```

If you can't run `corepack enable` (no admin rights), put `corepack` in front of each command instead, e.g. `corepack pnpm install`.

## Before you push

```sh
pnpm verify              # lint, typecheck, tests, build: the same as the GitHub "verify" check
```

Push only when it passes. The pre-push hook runs lint, typecheck and tests automatically. `pnpm verify` also runs the build. A branch that fails `verify` can't merge.

If you are working somewhere that can't run commands (a web-only agent, for example), push to your branch and open a **draft** PR. GitHub runs `verify` on it within about two minutes. Fix until it is green, then mark the PR ready.

Tests live next to the code as `lib/*.test.ts` and run with `pnpm test`.

## Environment variables

Every variable is listed by name in `src/.env.example`. For local runs, copy it to `.env.local` and fill in only what you need; never commit `.env.local`. Production values live in AWS SSM, managed by the maintainer. Ask for a change rather than adding values yourself.

## Deployment

- Platform: **AWS Amplify, London (eu-west-2), since 2026-11-18**. Pushing to `main` deploys.
- Build: `amplify.yml` at the repo root (pnpm, Node 22, base directory `src/`)
- Domain: `eccp.empowrcic.org`
- Secrets: AWS SSM, written to `.env.production` at build. There are no Netlify environment variables any more.
- Background work: certificates are issued inside the request (`ECCP_INLINE_ISSUANCE=1`). Renewal reminders run daily at 08:00 UTC from AWS EventBridge via `POST /api/cron/renewal-reminders`.
- The Netlify site, `netlify.toml` and `src/netlify/` are a fallback only, to be removed about 2026-12-02. Do not add new Netlify functions or Netlify-only environment variables.

See `CLAUDE.md` and `ops/CONTEXT.md` for full project and deployment guidance.
