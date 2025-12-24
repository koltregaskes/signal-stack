# Setup guide

This project is currently documentation-only while we define requirements. Once code is added, use this guide to stand up the environment.

## Prerequisites
- Node.js and npm (for the web UI and API) — exact versions TBD.
- Postgres and Redis services available (cloud-hosted preferred).
- Access to cloud object storage (e.g., S3-compatible) for media caching.
- Platform developer accounts and apps for X, Instagram (Business), YouTube, TikTok, Bluesky, and Threads.

## Environment configuration (to be finalized)
- App secrets and API keys will be stored in environment variables (e.g., `.env`) and kept out of source control.
- Provide callback URLs for each platform’s OAuth flow when registering developer apps.
- Configure storage buckets for media uploads and any transcoding outputs.

## Expected local steps (once code exists)
1. Clone the repo.
2. Install dependencies: `npm install` (or the package manager we standardize on).
3. Copy `.env.example` to `.env` and fill in platform credentials and database/storage URLs.
4. Run database migrations and start services (API, workers, and web UI).

## Cloud deployment
- Target a single cloud environment to start (e.g., Fly.io, Render, or similar) with managed Postgres/Redis.
- Use CI to run tests and deploy on main branch merges.
- Enable HTTPS, a custom domain, and environment-specific secrets.

As we implement the stack, this document will be updated with concrete commands and versions.
