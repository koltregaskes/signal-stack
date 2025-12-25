# Architecture (current state + next steps)

## Today (preview-only)
- **Static UI**: `web/index.html` + `styles.css` + `app.js` show the planned experience (composer, platform chips, quote toggle, weekly cards, validation rail). No build tools or backend yet.
- **Why static first**: Lets you see and share the design now, works on GitHub Pages, and avoids npm install issues until we add API code.

## Near-term build plan
- **Frontend**: Keep the current layout, then add interactivity (drag-and-drop calendar, per-platform validation) with a lightweight framework once dependency access is confirmed. Responsive and touch-friendly from the start.
- **Backend**: Add a small API (likely Node/Express or FastAPI) for auth, scheduling, media validation, and platform posting. Queue worker for retries.
- **Storage**: Postgres for schedules/posts, Redis for queues, object storage for media. Until then, UI uses sample data only.
- **Secrets & config**: Will live in `.env.example` and deployment secrets. No secrets are required yet.
- **AI helpers**: Slots for caption/hashtag suggestions and “best time” hints; wired after core posting works.

## Platform limits to keep in mind
- **X (Twitter)**: Quote posts require valid tweet IDs and media rules; API quotas apply per app. We’ll surface any API errors clearly.
- **Instagram (Business)**: Publishing requires Business/Creator accounts and app review. Media size/time limits must be validated.
- **YouTube vs. Shorts**: Shorts benefit from under-60s vertical videos; standard uploads support `publishAt` for scheduling.
- **TikTok**: Video size/duration caps and category approvals can apply.
- **Bluesky/Threads**: Posting is available; scheduling relies on our clock. Media limits will be enforced in the UI.

## Deployment vision
- **Static preview**: Served via GitHub Pages now.
- **App**: CI/CD to push backend + built frontend to a managed host (e.g., Render/Fly/Vercel). Health checks, logs, and alerting once API calls go live.

## Accessibility baseline
- Target **WCAG 2.2 AA** with semantic HTML, labelled controls, visible focus, and clear validation messaging.
- Add automated spot checks with `npx pa11y web/index.html` and manual keyboard/screen-reader passes. See `ACCESSIBILITY.md` for the checklist.
