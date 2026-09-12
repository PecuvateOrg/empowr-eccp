# Operations Workspace

This workspace owns ECCP deployment, environment configuration, and release checks.

## Deployment

- Platform: Netlify
- Domain: not yet assigned
- Production branch: `main`
- Repository base directory: `src/`
- Build command: `pnpm run build`
- Publish directory: `.next`
- Runtime: Node.js 22

## Environment Variables

No environment variables are required by the initial scaffold. Document every future variable here and add its blank name to `src/.env.example`.

## Process

1. Run lint, typecheck, and build from `src/`.
2. Run `/pre-build-check` and `/pre-deploy-security` before the first deployment.
3. Use `/netlify-deploy` to create and link the site after a domain is chosen.
4. Verify security headers against a live HTML response after deployment.

## Constraints

- Never commit secrets or deploy credentials.
- Do not deploy until the domain and external-service architecture are confirmed.
- Netlify runtime assets must live inside `src/`.
