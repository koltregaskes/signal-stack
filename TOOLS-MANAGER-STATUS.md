# Tools Manager Status

Updated: 2026-04-09

## Current Phase
- Release-ready dry-run product is shipped locally and on `origin/main`.
- Current repo focus has moved from core scheduling/build-out to live connector work.

## Shipped
- Local-first Signal Stack app with Node backend, shared validation, uploads, JSON persistence, and dry-run scheduler.
- Media-first composer with pipeline states, per-platform briefs, account routing, layout controls, offline shell, and polished UI.
- Week and month calendar views, queue import/export, alerts, activity log, and dry-run publish processing.

## In Progress
- No active repo-local blocker at the moment.
- Next engineering slice is live publishing connectors, starting with YouTube.

## Remaining
- Real OAuth and live-post connectors for YouTube/Shorts, Instagram, and TikTok.
- Hosted production deployment with persistent storage and real secret management.
- Final production copy/legal pass once the live connector scope is locked.

## Blockers
- No blocker remains for the shipped dry-run app.
- Live publishing still depends on external platform credentials, OAuth setup, and approval.

## Next Actions
- Wire YouTube live publishing first, then Instagram, then TikTok draft-first.
- Deploy the app to a persistent Node host and add production secrets.
- Run a true end-to-end live publish verification once credentials exist.

## Verification Snapshot
- `node --test` passes.
- Smoke-tested media-first composer, week/month calendar, account routing, JSON import/export, and dry-run due publishing.
- Browser console was clean on the final release pass.
