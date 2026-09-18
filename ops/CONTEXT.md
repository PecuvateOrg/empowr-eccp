# Operations Workspace

This workspace owns ECCP deployment, environment configuration, and release checks.

## Deployment

- Platform: Netlify (`empowr-eccp`)
- Domain: `eccp.empowrcic.org`
- Production branch: `main`
- Repository base directory: `src/`
- Build command: `pnpm run build`
- Publish directory: `.next`
- Runtime: Node.js 22

## Environment Variables

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `RESEND_API_KEY` (secret) — all `production` context on the `empowr-eccp` Netlify site. See `_config/registry/netlify-sites.md` for details.

## Process

1. Run lint, typecheck, and build from `src/`.
2. Run `/pre-build-check` and `/pre-deploy-security` before the first deployment.
3. Use `/netlify-deploy` to create and link the site after a domain is chosen.
4. Verify security headers against a live HTML response after deployment.

## Constraints

- Never commit secrets or deploy credentials.
- Do not deploy until the domain and external-service architecture are confirmed.
- Netlify runtime assets must live inside `src/`.
