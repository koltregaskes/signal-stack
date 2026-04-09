# Signal Stack Status

## Shipped
- Local-first Signal Stack app with Node backend, shared validation, uploads, JSON persistence, and dry-run scheduling.
- Media-first composer with pipeline states, per-platform briefs, account routing, layout controls, PWA shell, and polished 2026-style UI.
- Week and month calendar views, queue import/export, alerts, activity log, and dry-run publish processing.

## Remaining
- Real OAuth and live-post connectors for Instagram, TikTok, and YouTube/Shorts.
- Hosted production deployment and secret management.
- Final production pass on privacy/terms copy once the live connector scope is locked.

## Blockers
- No repo-local blocker for the shipped dry-run product.
- Live publishing still depends on platform credentials, OAuth setup, and platform approval outside the repo.

## Next Actions
- Wire YouTube live publishing first, then Instagram, then TikTok draft-first.
- Deploy the app on a persistent Node host and add real platform secrets.
- Run an end-to-end live publish pass once credentials are available.
