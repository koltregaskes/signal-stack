# Changelog

## 2026-04-09
- Reworked the queue into a real publishing pipeline with `idea`, `draft`, `approved`, `scheduled`, and `posted` stages plus operational `retrying` and `failed` states.
- Added structured per-item platform target cards with account routing plus per-target caption and hashtag overrides.
- Rebuilt the composer into a media-first cockpit with a larger upload stage, compact quick-setup sidebar, tabbed sections, fold-out platform controls, and richer local media previews.
- Added persistent workspace layout controls for `Compact`, `Launch Strip`, and `Inspector`, plus a tabbed slide-away inspector for checks and account routing.
- Added week and month calendar views that both read from the same pipeline data.
- Added image, video, and thumbnail URL slots alongside local media uploads.
- Added explicit local composer draft persistence and refreshed JSON import/export handling for the pipeline format.
- Updated the service worker to use a new shell cache version and a network-first navigation strategy so the offline shell updates cleanly.
- Removed external font dependencies so the shell stays self-contained offline.

## 2026-04-06
- Added `PLATFORM-API-RESEARCH.md` with current official API economics, capability notes, and a recommended launch scope for Instagram, TikTok, and YouTube/Shorts.
- Updated the README to point at the platform research and recommended product focus.

## 2026-04-05
- Replaced the static preview with a launchable local app backed by a small Node server.
- Added shared validation logic for captions, ratios, durations, media sizes, quote mode, collisions, and cadence checks.
- Added local account routing, including multi-account X routing.
- Added local media uploads and metadata-aware composer validation.
- Added weekly drag-and-drop scheduling, alert handling, and due-item processing.
- Added `.env.example`, `package.json`, `Dockerfile`, tests, service worker, and favicon.
- Added live Bluesky publishing support for text and image posts, with dry-run scaffolding for the other networks.

## 2025-12-25
- Added static UI preview and initial documentation set.

## 2025-12-24
- Documented the initial product plan and pre-build responsibilities.
