# Setup guide

This project is currently documentation-only while we define requirements. This guide explains how setup will work once code is in place, using plain language.

## Prerequisites (what you will need)
- Node.js and npm (for the web UI and API) — exact versions TBD.
- Postgres and Redis services (prefer managed cloud so you don’t run servers yourself).
- Cloud object storage (e.g., S3-compatible) for media caching and backups.
- Developer apps/keys for X, Instagram (Business), YouTube, TikTok, Bluesky, and Threads.

## Environment configuration (to be finalized)
- App secrets and API keys live in environment variables (e.g., `.env`) and stay out of git.
- Each platform needs a callback URL for OAuth. We will list exact URLs once routes are set.
- Storage buckets hold uploads and any resized/transcoded copies.
- Redis keeps the job queue and rate-limit counters.

### Secrets you will add later (names will be provided)
- Database URL, Redis URL, and storage bucket credentials.
- Platform API credentials for X, Instagram Business, YouTube, TikTok, Bluesky, Threads.
- App credentials for the web UI/backend (e.g., session keys, encryption key for stored tokens).

I will supply exact variable names (e.g., `X_CLIENT_ID`, `YOUTUBE_API_KEY`, `SESSION_SECRET`) and a `.env.example` so you can copy/paste into repo secrets without editing code.

## Expected local steps (once code exists)
1. Clone the repo.
2. Install dependencies: `npm install` (or the package manager we standardize on).
3. Copy `.env.example` to `.env` and fill in platform credentials and database/storage URLs.
4. Run database migrations and start services (API, workers, and web UI).
5. Open the web app and complete the OAuth connections for each platform.

## Cloud deployment
- Start with one cloud environment (e.g., Fly.io, Render, or similar) using managed Postgres/Redis.
- Use CI to run tests and deploy when changes land on the main branch.
- Enable HTTPS, custom domain, and environment-specific secrets.
- Set up daily backups for the database and storage bucket.

## What you can do now
- Make sure you can access developer portals for each platform (X, Instagram Business via Facebook developer console, YouTube, TikTok, Bluesky, Threads). We will create apps/keys there when code is ready.
- Decide which GitHub repo you want to store secrets in (Settings → Secrets and variables). Nothing to add yet; a checklist will follow.
- Keep using GitHub Pages for docs; once the app exists, we’ll add CI to deploy the real UI to your chosen host.

As we implement the stack, this document will be updated with concrete commands and versions.
