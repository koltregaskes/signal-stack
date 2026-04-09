# Architecture

## Stack choice

- **Frontend**: zero-build HTML/CSS/ES modules in `web/`
- **Shared logic**: platform rules, time helpers, and validation in `shared/`
- **Backend**: dependency-light Node server in `server.mjs` plus `server/`
- **Persistence**: local JSON state in `.local/data/app-state.json`
- **Uploads**: local media files in `.local/uploads/`
- **Offline shell**: service worker caches the app shell for fast local reloads

This keeps the product easy to run, easy to ship, and easy to inspect without introducing a framework tax too early.

## Runtime model

1. `server.mjs` serves the static frontend and the JSON API.
2. The frontend loads `/api/bootstrap` for posts, accounts, alerts, and runtime config.
3. Composer saves posts back to `/api/posts`.
4. Composer drafts also autosave locally in browser storage.
5. Media uploads go to `/api/uploads` and are stored locally.
6. A scheduler loop checks due items every 30 seconds.
7. Dry-run accounts publish immediately as simulated deliveries.
8. Live API accounts require platform secrets before they can run.

## Pipeline model

Each item moves through a shared pipeline:

- `idea`
- `draft`
- `approved`
- `scheduled`
- `posted`

Operational states still sit alongside that main path:

- `retrying`
- `failed`

That keeps editorial workflow and delivery workflow honest without collapsing them into one vague "scheduled post" state.

## Delivery model

- `Dry run` is the default launch mode.
- `Live API` is available per account, not globally.
- The scheduler validates a post again before delivery.
- Successful deliveries move items to `posted`.
- Failed deliveries either retry with backoff or move into the alert rail.

## Validation model

Validation is shared between frontend and backend so the same rules drive:

- composer feedback
- drag-and-drop collision blocking
- queue summaries
- platform-specific publishing briefs
- per-target caption and hashtag previews
- pre-publish checks

Platform rules are split into:

- **hard rules**: treated as blockers
- **conservative defaults**: treated as warnings

That lets the studio be opinionated without becoming brittle.

## Connector shape

- `server/connectors.mjs` handles delivery per platform.
- `Bluesky` live posting is implemented for text and image payloads.
- `YouTube` live upload now consumes the target-level upload title, privacy, made-for-kids, and tag fields from the composer.
- Other networks currently use dry-run mode plus connector scaffolding so the app can still be launched safely while secrets and approvals are gathered.

## Offline model

- The service worker caches the app shell for offline relaunches.
- The shell now avoids external font dependencies so the UI stays self-contained.
- Browser local storage keeps the active composer draft even before it is saved into the main queue.
- Audio uploads are kept locally as soundtrack references and are not counted as primary publish media for visual-first networks.

## Deployment shape

- Local launch: `start.cmd`
- Container launch: `docker build` + `docker run`
- Managed host target: any Node-capable host that can expose the server and persist local or mounted storage

For a future hosted production move, the natural next step is swapping local JSON storage for a database and object storage layer while keeping the frontend and validation contracts intact.
