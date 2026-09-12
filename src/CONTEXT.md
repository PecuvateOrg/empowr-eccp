# Application Workspace

This directory is the self-contained Next.js application and the working directory for every pnpm command.

## Structure

- `app/` — App Router layouts, pages, and route handlers
- `components/` — reusable React components, one PascalCase component per file
- `lib/` — typed data, constants, utilities, and service adapters
- `public/` — static assets served by Next.js

## Conventions

- Prefer Server Components; add `"use client"` only for real browser interactivity.
- Use TypeScript strict mode and explicit parameter and return types; never use `any`.
- Resolve local imports through the `@/*` alias, which maps to this directory.
- Centralise routes, programme data, and design tokens rather than hardcoding them in components.
- Use Tailwind CSS 4 and shadcn/ui components added on demand.
- Use Lucide icons rather than emoji in the interface.

## Commands

- `corepack pnpm dev` — local development server
- `corepack pnpm lint` — ESLint
- `corepack pnpm typecheck` — TypeScript validation
- `corepack pnpm build` — production build

## Constraints

- Programme facts and terminology come from the Empowr CIC KB.
- Do not introduce authentication or persistence until the architecture decision is recorded.
- Anything required by Netlify at build or runtime must remain inside this directory.
