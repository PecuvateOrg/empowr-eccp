# Operations Workspace

This workspace owns ECCP deployment, environment configuration, and release checks.

## Deployment

- Platform: **AWS Amplify** (app `d2gj9srl8g530v`, eu-west-2), since 2026-11-18. Pushing to `main` deploys.
- Build: `amplify.yml` at the repo root. pnpm, `pnpm run build`, Node.js 22, app root `src/`.
- Domain: `eccp.empowrcic.org`, via an Amplify domain association (Route53 CNAME to CloudFront)
- Fallback: the Netlify site `empowr-eccp`, kept until about 2026-12-02 and then deleted along with `netlify.toml` and `src/netlify/`

## Environment Variables

Stored in AWS SSM at `/amplify/d2gj9srl8g530v/main/`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` and `ECCP_EFN_API_KEY`. Amplify passes them to the build only, and `amplify.yml` writes them to `.env.production` for the server. A new variable therefore needs an SSM entry **and** a redeploy. Never use Netlify environment variables.

## Scheduled and background work

- Renewal reminders: AWS EventBridge rule `eccp-renewal-reminders-daily` (08:00 UTC) calls `POST /api/cron/renewal-reminders` with the `CRON_SECRET` bearer token.
- Certificates: issued inside the request on Amplify. Staff can test PDF rendering from `/management` → "Test certificate PDF", which never uses up a certificate number.

## Process

1. Run lint, typecheck and build from `src/`.
2. Merge to `main`; Amplify builds and deploys.
3. After a deploy, check the live site and, if certificates changed, use the staff certificate test.

## Constraints

- Never commit secrets or deploy credentials.
- New background or scheduled work goes to AWS (EventBridge, or inline in the request), never to Netlify functions.
- A database change on the shared `empowr-cic` project is applied by Pecuvate maintainers; propose it as SQL in the PR.
