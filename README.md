# Empowr ECCP

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

- Platform: Netlify
- Branch: `main`
- Base directory: `src/`
- Domain: not yet assigned

See `CLAUDE.md` and `ops/CONTEXT.md` for full project and deployment guidance.
