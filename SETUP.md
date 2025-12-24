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

As we implement the stack, this document will be updated with concrete commands and versions.
