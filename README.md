# Buffer replacement roadmap

This repo explains a simple, cloud-hosted alternative to Buffer. The goal: let you schedule and publish to your social accounts without dealing with technical setup.

## Quick links (start here)
- [Architecture overview](ARCHITECTURE.md) — what pieces exist and why they matter
- [Setup guide](SETUP.md) — how the app will be hosted and configured
- [Usage](USAGE.md) — how you will schedule, move, and post once built
- [Troubleshooting](TROUBLESHOOTING.md) — simple fixes for common issues
- [Project plan and history](PLAN.md) — your requests, tasks, and status emojis
- [Changelog](CHANGELOG.md) — dated record of changes

## Platform capabilities and notes (plain language)
- **X (Twitter)**: We can post and schedule. A "Quote this post" toggle makes pasted X links become quotes (not just links). Media must fit X rules; the app will warn or resize where allowed.
- **Instagram (Business)**: Works with your existing Business accounts through the Instagram Graph API.
- **YouTube**: Post standard videos and Shorts. A simple switch chooses Shorts (good for teasers) vs. normal uploads (full videos). Scheduling uses the platform’s `publishAt` setting when allowed.
- **TikTok**: Video uploads with scheduling when the app permissions allow. We’ll validate duration and size before you schedule.
- **Bluesky**: Text and media posts are supported; scheduling is handled by our app clock.
- **Threads**: Posting and scheduling supported; any media limits will be shown in the UI.

## Core experience (what you will see first)
- **Unified composer**: One place to write a post and pick multiple accounts. Each platform shows the fields it needs (title/description for YouTube, quote toggle for X, captions for Instagram/Threads).
- **Scheduling calendar**: Drag-and-drop weekly/monthly view so you can move posts to new times easily.
- **Move/clone posts**: Shift a post (with media) between X profiles or other accounts without re-uploading.
- **Smart media checks**: The UI blocks invalid uploads and offers resizing hints or automatic fixes when possible.
- **Media library**: Reuse uploaded files for future posts or clones to save time.
- **Mobile-friendly web**: Works well on phones/tablets now; an Android wrapper can come later.

## What we need from you
- Final account groups (news, art/video, forwards) and any default posting times.
- Per-platform defaults (e.g., Shorts in the morning, full videos in the evening).
- Branding/style hints (colors, logo, font vibes). We’re aiming for a “modern 2026” look: clean, airy, high-contrast, and keyboard-friendly.

## Next steps (simple plan)
1. Pick the exact tech stack (framework, database, hosting). I’ll propose defaults so you don’t have to decide.
2. Build the unified composer with platform-specific fields (quote toggle for X, Shorts toggle for YouTube).
3. Ship the calendar with drag-and-drop and a “move to another account” option.
4. Add media checks and auto-fixes before scheduling/publishing.
5. Wire up platform APIs in priority order (X, Instagram, YouTube, then TikTok/Bluesky/Threads).
6. Add retries, alerts, and a clear error panel when a scheduled post fails.

## AI-first and automation mindset
- Use AI helpers (LLM-driven prompts for captions/hashtags and image/video fit checks) to speed up posting.
- Automate repetitive steps (reusing media, cloning posts, suggesting best times).
- Keep security simple: secrets stay encrypted; you use a single login; the system handles OAuth for each platform.
