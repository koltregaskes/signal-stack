# Setup (simple for now)

You can already view the UI preview locally:

1. Download or clone the repo.
2. Open `web/index.html` in your browser (double-click or drag into a tab). The page is responsive and uses no build tools.
3. When APIs are added, we’ll introduce environment variables in a `.env.example` file and a small local server so you never handle low-level config.

## Hosting plan (plain language)
- **Cloud-first**: Code will deploy automatically from GitHub once the backend exists. For now, GitHub Pages can serve the static preview.
- **Secrets**: API keys and app secrets will live in repository/environment secrets (not in git). I will list exact names when we connect each platform.
- **Storage**: Media will use a bucket (e.g., S3-compatible). Until then, the preview uses sample data only.

## What you can prepare
- Make sure you have or can request developer access for: X, Instagram Business, YouTube, TikTok, Bluesky, and Threads.
- Confirm where you want to host (GitHub Pages for static + a small backend on something like Fly.io/Render/Vercel). I will propose defaults; you just approve.
- Gather any brand assets (logo, colors) so we can skin the UI quickly.

## When errors happen
If you see missing styles or scripts, confirm you opened `web/index.html` directly. If npm installs fail in your environment, the preview still works because it uses plain HTML/CSS/JS.
