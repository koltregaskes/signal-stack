# Project plan and history

This document tracks your requests, our tasks, and status at a glance using emoji markers.

## Status legend
- ✅ Complete
- 🚧 In progress
- 📝 Planned

## Request history (latest first)
- 🚧 **Define next steps and secrets flow**: clarify what you need to do (prepare platform developer access) and what I will do next (stack proposal, secrets template, CI/deploy flow).
- ✅ **Expand documentation clarity**: simpler language, clear limits, AI-first mindset noted, and 2026-style design emphasis.
- ✅ **Document set added**: changelog, architecture, setup, troubleshooting, usage, plan.
- ✅ **Initial requirements captured**: multi-platform scheduler with calendar, drag-and-drop rescheduling, per-platform fields (quote toggle for X, Shorts toggle for YouTube), cloud-hosted, mobile-friendly web UI.

## Task board
### Foundations
- 🚧 Clarify platform-specific fields and media limits (quote toggle for X, Shorts flag for YouTube, caption requirements elsewhere). Include warnings/resizing guidance.
- 📝 Choose the tech stack (API framework, UI framework, DB, queue, hosting). I will propose defaults so you don’t have to pick.
- 📝 Define security and secret storage approach (encrypted secrets, minimal access) and list exact secret names for `.env` and repo settings.

### UX and features
- 📝 Build unified composer with account groups (news, art/video, forwards) and multi-account selection.
- 📝 Build calendar with drag-and-drop and move/clone actions.
- 📝 Add media validation + auto-resize where allowed; block invalid uploads early.
- 📝 Add retries/alerts for failed scheduled posts and a friendly error panel.

### AI and automation
- 📝 Add AI helpers for captions/hashtags and best-time suggestions.
- 📝 Add media fit checks that can auto-resize or recommend fixes.

### Deployment
- 📝 Set up cloud environment, CI, and backups for the database/object storage.
- 📝 Add `.env.example`, GitHub repo secrets guidance, and GitHub Pages/hosting instructions so you only paste secrets (no code edits needed).

## Next actions (simple checklist)
- **For you now**: Confirm the three account groups and gather developer access for X, Instagram Business, YouTube, TikTok, Bluesky, and Threads (no keys pasted into git).
- **For me next**: Propose the tech stack, add the `.env.example` placeholder secrets, and draft the CI/deploy steps so you only need to add secrets in repo settings.
- **Coming soon**: Build the unified composer (with quote toggle for X and Shorts toggle for YouTube) and the drag-and-drop calendar.

## Upcoming decisions needed from you
- Confirm account groups and default posting times.
- Share any branding preferences (colors/logo/font) to lock the “modern 2026” look.
- Confirm if you want AI suggestions on by default or opt-in per post.
