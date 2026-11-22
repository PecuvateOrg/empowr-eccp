# My Shifts reader release gates

Reader is server-only and disabled unless ECCP_MY_SHIFTS_ENABLED=1. It derives identity from the existing authenticated session, not a URL or browser payload. No route invokes this reader yet.

Before wiring to the page or enabling:
- Approve and apply schema of record; confirm relationship names and service-role grants.
- Integration test two distinct coach accounts, unauthenticated access, expired sessions, cancelled assignments, changed/cancelled sessions, and database errors.
- Add bounded date filtering and deterministic pagination before relying on complete results; the initial reader is capped at 200 rows.
- Render source cancellation and review status distinctly, never silently present affected sessions as confirmed.
- Keep feature flag off until maintainer sign-off. Do not expose service credentials or other coaches' records.
