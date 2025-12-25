# Buffer replacement roadmap (now with first UI preview)

This repo tracks a simple, cloud-hosted alternative to Buffer. The goal: let you schedule and publish to your social accounts without dealing with technical setup. A first visual preview now lives in `web/index.html` so you can see the planned experience.

## Quick links (start here)
- [Architecture overview](ARCHITECTURE.md) — what pieces exist and why they matter
- [Accessibility](ACCESSIBILITY.md) — WCAG 2.2 AA targets and how to check them
- [Setup guide](SETUP.md) — how the app will be hosted and configured
- [Usage](USAGE.md) — how you will schedule, move, and post once built
- [Troubleshooting](TROUBLESHOOTING.md) — simple fixes for common issues
- [Project plan and history](PLAN.md) — your requests, tasks, and status emojis
- [Changelog](CHANGELOG.md) — dated record of changes
- [Costs](COSTS.md) — what might cost money (APIs, hosting) with call estimates
- [AI helper onboarding (llms.txt)](llms.txt) — quick agent guide and commands
- [Agent instructions](AGENTS.md) — how to work in this repo
- [UI preview](web/index.html) — open locally or via GitHub Pages to see the design

## How to get started (dummy-proof)
1. **See it live**: Open the GitHub Pages URL you enabled for this repo (usually `https://<your-github-username>.github.io/buffer-replacement/`). If that does not load, use the local option below.
2. **See it locally**: Download/clone this repo, then double-click `web/index.html` to open it in any modern browser. No installs or commands required.
3. **What to install now**: Nothing. When the backend and API calls arrive, I’ll tell you exactly which tool to install (likely Node.js) and provide a one-line command.
4. **Secrets/tokens**: None needed yet. When API work starts, I’ll hand you copy/paste names and where to store them (GitHub repo **Settings → Secrets and variables → Actions**). You’ll grab the keys from the official portals (X Developer Portal, Meta for Instagram/Threads, Google Cloud Console for YouTube, TikTok Developers, Bluesky PDS) and paste them into secrets—not into files.
5. **Where to ask for help**: If something looks off, check the Troubleshooting guide first, then ping me with what you see.

## Platform capabilities and notes (plain language)
- **X (Twitter)**: We can post and schedule. A "Quote this post" toggle makes pasted X links become quotes (not just links). Media must fit X rules; the app will warn or resize where allowed.
- **Instagram (Business)**: Works with your existing Business accounts through the Instagram Graph API.
- **YouTube + Shorts**: Post standard videos and Shorts. A simple switch chooses Shorts (good for teasers) vs. normal uploads (full videos). Scheduling uses the platform’s `publishAt` setting when allowed.
- **TikTok**: Video uploads with scheduling when the app permissions allow. We’ll validate duration and size before you schedule.
- **Bluesky**: Text and media posts are supported; scheduling is handled by our app clock.
- **Threads**: Posting and scheduling supported; any media limits will be shown in the UI.

## Core experience (what you can now see in the preview)
- **Unified composer**: One place to write a post and pick multiple accounts. Each platform shows the fields it needs (title/description for YouTube, quote toggle for X, captions for Instagram/Threads).
- **Scheduling calendar**: A weekly preview is now visible; drag-and-drop will be wired next.
- **Move/clone posts**: Buttons are in the UI for moving between X profiles; logic will be added once APIs are wired.
- **Smart media checks**: A validation rail shows what will be auto-checked (sizes, captions, quote detection).
- **Mobile-friendly web**: Layout is responsive today; Android wrapper can come later.

## What we need from you
- Final account groups (news, art/video, forwards) and any default posting times.
- Per-platform defaults (e.g., Shorts in the morning, full videos in the evening).
- Branding/style hints (colors, logo, font vibes). We’re aiming for a “modern 2026” look: clean, airy, high-contrast, and keyboard-friendly.
- A quick ✅/❌ on using AI helpers by default (captions/hashtags/best times) or keeping them opt-in.

## What happens next (and what you can do now)
- **Right now**: A static preview exists in `web/index.html` so you can see the layout. No secrets needed yet.
- **Your part**: Gather platform developer access (X, Instagram Business, YouTube, TikTok, Bluesky, Threads) so we can create API keys later. Do not paste keys into git; we’ll use secrets in repo settings.
- **Upcoming for you**: When code lands that calls APIs, you will add secrets (API keys, database/storage URLs) to the repo settings. I will provide exact names and copy/paste values when we reach that step.
- **Upcoming for me**: Add `.env.example`, choose the final stack, wire basic API routes, and connect the UI preview to real data (auth + scheduling + media checks).

## AI-first and automation mindset
- Use AI helpers (LLM-driven prompts for captions/hashtags and image/video fit checks) to speed up posting.
- Automate repetitive steps (reusing media, cloning posts, suggesting best times).
- Keep security simple: secrets stay encrypted; you use a single login; the system handles OAuth for each platform.
