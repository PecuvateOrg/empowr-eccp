# Empowr ECCP — Non-Negotiables

Forced open by `CLAUDE.md`'s Self-Reference line — read before doing anything else in this
project.

## Rules

- Never create or commit `DEVLOG.md` or `memory.md` in this public repository.
- Before every push, run `pnpm verify` in `src/` (lint, typecheck, tests, build: the same as the GitHub `verify` check) and push only when it passes. The pre-push hook in `.githooks/` runs the fast part automatically after `pnpm install`. Never push a fix you have not run; a branch that fails `verify` cannot merge.

## Naming Conventions

- Components: PascalCase (`CertificationCard.tsx`)
- Route segments and utilities: kebab-case
- Decision records: `YYYY-MM-DD-decision-title.md`
