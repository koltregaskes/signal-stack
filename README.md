# Buffer replacement roadmap

This repo documents a lightweight, cloud-hosted alternative to Buffer focused on scheduling and publishing to multiple social platforms with a simple, mobile-friendly web UI.

## Quick links
- [Architecture overview](ARCHITECTURE.md)
- [Setup guide](SETUP.md)
- [Usage (planned)](USAGE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Project plan and history](PLAN.md)
- [Changelog](CHANGELOG.md)

## Platform capabilities and notes (non-technical)
- **X (Twitter)**: Can publish and schedule posts via X API. A "Quote this post" toggle will make pasted X links count as quotes instead of plain URLs. Media uploads must meet X limits (size, aspect ratios) before posting.
- **Instagram (Business)**: Compatible with the Instagram Graph API for posting and scheduling.
- **YouTube**: Supports both standard videos and Shorts. Scheduling uses `publishAt`. Shorts use the same upload endpoint with “Shorts” metadata; a selector will choose Shorts vs. standard video so you can post teasers as Shorts and full videos as normal uploads.
- **TikTok**: Video uploads are supported; scheduling is available with proper app permissions.
- **Bluesky**: Supports posting text and media via the AT Protocol; scheduling will be handled by the app.
- **Threads**: Threads API supports posting; media and scheduling will be surfaced with any platform constraints.

## Core UX we will build first
- **Unified composer**: Compose once and target multiple accounts. Each platform shows the fields it needs (e.g., title/description vs. caption vs. quoted post toggle).
- **Scheduling & calendar**: Weekly/monthly calendar with drag-and-drop to move posts into new time slots. Time-zone aware.
- **Move/clone posts between accounts**: Copy a post (including media) from one X profile to another when you need to shift a slot.
- **Warnings and preflight checks**: Validate media size/length/aspect ratios per platform; block invalid uploads and, where possible, auto-resize images to meet limits before posting.
- **Media handling**: Central media library that reuses uploaded files when cloning posts. Videos go through pre-checks and, if needed, automatic resizing/transcoding.
- **Mobile-friendly web**: Web-only for now with responsive layouts; can wrap later into an Android app. Always cloud-hosted—no local setup required.

## What we need from you
- Finalize account groups (news, art/video, forwards) and any default scheduling times.
- Confirm if you want per-platform defaults (e.g., always post Shorts at 9am, standard YouTube at 6pm).
- Provide any branding or UI style preferences (colors/logos/fonts).

## Next steps (implementation outline)
1. Set up backend/API and database for posts, schedules, accounts, and media.
2. Build the unified composer with per-platform fields (title/description, quote toggle for X, Shorts toggle for YouTube, captions for Instagram/Threads, etc.).
3. Add calendar UI with drag-and-drop rescheduling and a “move to account” action.
4. Implement media validation/transcoding pipeline with clear warnings before you schedule or publish.
5. Connect platform APIs in priority order (start with X, Instagram, YouTube, then TikTok/Bluesky/Threads).
6. Add retries and error notifications for failed scheduled posts.
