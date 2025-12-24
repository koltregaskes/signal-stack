# Architecture overview

This is a cloud-first, web-only scheduler designed to publish to multiple social platforms (X, Instagram, YouTube/Shorts, TikTok, Bluesky, Threads). The goal is to ship a simple, reliable posting and scheduling flow before adding analytics.

## High-level components
- **Web UI (responsive)**: Calendar and composer with drag-and-drop rescheduling and per-platform fields (e.g., quote toggle for X, Shorts toggle for YouTube, captions for Instagram/Threads).
- **Backend API**: Manages accounts, posts, schedules, media validation, and publishing. Provides endpoints for composer actions, calendar views, and moving/cloning posts between accounts.
- **Background workers/queues**: Execute scheduled publishes, retries, and media processing (resize/transcode) so the UI stays responsive.
- **Storage**: Relational database for posts, schedules, and accounts; object storage for cached media; Redis for queues and rate-limit bookkeeping.
- **Auth**: Single login for you; OAuth/OIDC per social platform where required; secrets stored encrypted at rest.
- **Observability**: Structured logs for publishes and failures; metrics on success/failure counts and latency.

## Platform-specific considerations
- **X (Twitter)**: Requires OAuth 2.0. We will support quoting via a dedicated "Quote this post" toggle to disambiguate from plain links. Media uploads must match size/aspect rules before publish.
- **Instagram (Business)**: Uses the Instagram Graph API; supports images and reels with scheduling. Media must respect duration/dimension limits.
- **YouTube + Shorts**: Uses the same upload path; a toggle marks uploads as Shorts vs. standard. Scheduling uses `publishAt` when supported.
- **TikTok**: Video uploads with scheduling where app permissions allow; ensure duration/size checks.
- **Bluesky**: Posting via AT Protocol; scheduling handled by our app clock/queue.
- **Threads**: Posting and scheduling through the Threads/Instagram APIs; surface any media constraints in the UI.

## Data we will track
- Accounts and platform credentials (encrypted).
- Posts (content, media references, target accounts, and post type such as standard/quote/Shorts).
- Schedules and calendar slots (time-zone aware).
- Media assets with validation metadata (dimensions, duration, size, and any resizing/transcoding steps).
- Publish events and retries for auditability.

## UX flows to prioritize
1. Compose once, select target accounts or saved groups (news, art/video, forwards).
2. Toggle quote vs. standard posts on X; toggle Shorts vs. standard on YouTube.
3. Drag-and-drop rescheduling on a calendar; move/clone posts between accounts.
4. Preflight validation and resizing guidance before scheduling or publishing.

## Out of scope for now
- Analytics or engagement reporting.
- Mobile apps (web is responsive; native can follow later).
- Team/multi-user collaboration.
