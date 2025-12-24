# Architecture overview

This is a cloud-first, web-only scheduler for multiple platforms (X, Instagram, YouTube/Shorts, TikTok, Bluesky, Threads). It is designed to be simple for you to use and easy for us to automate.

## High-level components (plain language)
- **Web UI (responsive)**: Modern 2026-style interface with a calendar and composer. Drag-and-drop to reschedule. Platform-specific fields appear only when needed (quote toggle for X, Shorts toggle for YouTube).
- **Backend API**: Keeps the data organized (accounts, posts, schedules, media checks). It powers the composer, calendar, and move/clone actions.
- **Background workers/queues**: Handle scheduled publishes, retries, and media resizing/transcoding so the UI never freezes.
- **Storage**: A database for posts/schedules/accounts, object storage for media, and Redis for queues and rate-limit tracking.
- **Auth**: Single login for you. Platform accounts connect through OAuth; secrets stay encrypted.
- **Observability**: Clear logs and metrics for publishes, failures, and timing so issues are easy to spot.
- **AI helpers**: Optional LLM features to suggest captions/hashtags, detect media issues early, and recommend schedule times. These run server-side to avoid browser limits.

## Platform-specific considerations and limits
- **X (Twitter)**: OAuth 2.0 required. Quoting uses a "Quote this post" toggle to avoid treating links as plain URLs. Media must meet size/aspect rules; we will warn and, where allowed, auto-resize. Rate limits exist; retries with backoff will help.
- **Instagram (Business)**: Instagram Graph API; supports images and reels with scheduling. Business accounts are required. Media must meet duration/dimension caps; we will pre-check and shrink images if possible.
- **YouTube + Shorts**: Same upload path with a Shorts flag. Scheduling uses `publishAt` when available. Large videos use resumable uploads; quotas apply, so we cache uploads and reuse when cloning.
- **TikTok**: Video uploads with scheduling if the app permissions are granted. Duration/size rules are strict; we will validate before upload.
- **Bluesky**: Posts via AT Protocol; scheduling is handled by our own queue/time. Media size limits are smaller than other platforms; we will warn early.
- **Threads**: Posting and scheduling through Threads/Instagram APIs; media constraints appear inline in the composer.

## Data we will track
- Accounts and platform credentials (encrypted).
- Posts (content, media references, target accounts, and post type such as standard/quote/Shorts).
- Schedules and calendar slots (time-zone aware).
- Media assets with validation metadata (dimensions, duration, size, and any resizing/transcoding steps).
- Publish events and retries for auditability.
- Optional AI suggestions (e.g., captions) stored only if you accept them.

## UX flows to prioritize
1. Compose once, select target accounts or saved groups (news, art/video, forwards).
2. Toggle quote vs. standard posts on X; toggle Shorts vs. standard on YouTube.
3. Drag-and-drop rescheduling on a calendar; move/clone posts between accounts.
4. Preflight validation and resizing guidance before scheduling or publishing.
5. Simple error panel that explains what failed and how to fix it in plain language.

## Out of scope for now
- Analytics or engagement reporting.
- Mobile apps (web is responsive; native can follow later).
- Team/multi-user collaboration.
