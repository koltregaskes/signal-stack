# Signal Stack

`Signal Stack` is a local-first creator scheduling studio for image and video publishing.

It is built for the gap between text-first schedulers and the real work of planning Instagram, TikTok, YouTube, Shorts, X, Bluesky, and Threads. The product direction is still crisp and creator-focused, but the repo now ships a real local app instead of just a visual preview.

## Quick links
- [Architecture overview](ARCHITECTURE.md)
- [Platform API research](PLATFORM-API-RESEARCH.md)
- [Midnight Signal release cockpit demo](RELEASE-COCKPIT-DEMO.md)
- [Tools Manager status](TOOLS-MANAGER-STATUS.md)
- [Setup guide](SETUP.md)
- [Usage notes](USAGE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Changelog](CHANGELOG.md)
- [App entry](web/index.html)

## What ships now

- Zero-build frontend with a polished scheduling cockpit
- Local Node backend for posts, accounts, alerts, uploads, and due-item processing
- True creator pipeline: `idea -> draft -> approved -> scheduled -> posted`
- Week and month calendar views that read from the pipeline
- Structured per-item platform targets with account routing for Instagram, TikTok, YouTube, and the wider platform set
- Base and per-target title / caption / hashtag handling
- Platform-specific publishing briefs for Instagram, TikTok, YouTube, and Shorts
- Local media metadata capture plus image/video/thumbnail/audio URL slots
- Local audio uploads as soundtrack references for rendered cuts
- Per-platform validation for captions, ratios, durations, media counts, and quote routing
- Account routing, including moving a post to another X account
- Local draft persistence in the browser plus JSON import/export for the pipeline
- Retry and alert rail for scheduled delivery issues
- Per-post delivery inspector with route summaries, latest result snapshots, and publish history
- Offline-first shell caching without external font dependencies
- Docker scaffold and `.env.example` for live connector setup

## Publishing modes

- `Dry run`: fully usable now and safe for launch/demo work
- `Live API`: configurable account-by-account once secrets are present
- `Bluesky`: live posting is wired for text and image posts
- `Instagram`, `Threads`, `TikTok`, `YouTube`, `Shorts`, `X`: connector scaffolding and validation are in place, but live delivery still depends on app credentials, OAuth, and platform approval

`YouTube` live upload now also reads the per-target upload title, privacy, audience, and tag metadata from the studio.

## Recommended launch scope

- Use official APIs for `Instagram`, `TikTok`, and `YouTube/Shorts`
- Keep `X` and `Threads` on `Typefully`
- Treat browser automation as a supervised fallback, not the default delivery architecture

The reasoning and current cost readout live in [PLATFORM-API-RESEARCH.md](PLATFORM-API-RESEARCH.md).

## Notes on validation

- Official limits are treated as hard blockers where we have high confidence.
- Conservative launch defaults are surfaced as warnings instead of hard stops.
- That keeps the studio useful now without pretending every platform rule is perfectly static forever.

## Current status

- Launchable locally with `start.cmd`
- Testable with `node --test`
- Container-ready with `Dockerfile`
- Still able to fall back to a static preview when the backend is unavailable
