# Setup

1. Use `start.cmd` for the easiest local launch, or open `web/index.html` directly in a browser.
2. If you want a simple local launch point, use the launcher in `W:\Agent Workspace 2\tools\buffer-replacement`.
3. The app stores queue items in browser local storage, so no backend or install step is needed right now.
4. When backend work begins later, this repo will gain a `.env.example` file and a small local server setup.

## Hosting direction
- The current app can be served as static files.
- The eventual product will need a cloud backend for OAuth, scheduling, storage, and media handling.
- Secrets should live in environment or repository secrets, not in git.
