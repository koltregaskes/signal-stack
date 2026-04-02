# Setup

1. Open `web/index.html` in a browser. No build step is needed.
2. If you want a simple local launch point, use the launcher in `W:\Agent Workspace 2\tools\buffer-replacement`.
3. When backend work begins later, this repo will gain a `.env.example` file and a small local server setup.

## Hosting direction
- The current preview can be served as static files.
- The eventual product will need a cloud backend for OAuth, scheduling, storage, and media handling.
- Secrets should live in environment or repository secrets, not in git.
