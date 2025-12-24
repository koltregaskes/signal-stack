# Project plan and history

This document tracks your requests, our tasks, and status at a glance using emoji markers.

## Status legend
- ✅ Complete
- 🚧 In progress
- 📝 Planned

## Request history (latest first)
- 🚧 **Expand documentation clarity**: simpler language, clear limits, AI-first mindset noted, and 2026-style design emphasis (this update).
- ✅ **Document set added**: changelog, architecture, setup, troubleshooting, usage, plan.
- ✅ **Initial requirements captured**: multi-platform scheduler with calendar, drag-and-drop rescheduling, per-platform fields (quote toggle for X, Shorts toggle for YouTube), cloud-hosted, mobile-friendly web UI.

## Task board
### Foundations
- 🚧 Clarify platform-specific fields and media limits (quote toggle for X, Shorts flag for YouTube, caption requirements elsewhere). Include warnings/resizing guidance.
- 📝 Choose the tech stack (API framework, UI framework, DB, queue, hosting). I will propose defaults so you don’t have to pick.
- 📝 Define security and secret storage approach (encrypted secrets, minimal access).

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

## Upcoming decisions needed from you
- Confirm account groups and default posting times.
- Share any branding preferences (colors/logo/font) to lock the “modern 2026” look.
- Confirm if you want AI suggestions on by default or opt-in per post.
