# Setup

## Local launch

1. Copy `.env.example` to `.env` if you want to prepare live connector secrets.
2. Run `start.cmd`.
3. The app opens at `http://127.0.0.1:8032/`.

For private cross-device access over Tailscale, start it with your tailnet IP instead:

```powershell
start-tailscale.cmd 100.x.y.z
```

You can also run it manually:

```powershell
node server.mjs
```

## Tests

```powershell
node --test
```

## Live connector prep

The app runs fine without secrets in dry-run mode.

When you are ready for live connectors, populate `.env` with the keys from `.env.example`:

- `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `MEDIA_SIGNING_SECRET`
- `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_CALLBACK_URL`
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_CALLBACK_URL`
- `THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_CALLBACK_URL`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_CALLBACK_URL`
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_CALLBACK_URL`
- `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`

Notes:

- `SESSION_SECRET` should be a long random secret used to sign the local session cookie.
- `TOKEN_ENCRYPTION_KEY` must be a 32-byte value. The app accepts either 64 hex characters or base64/base64url that decodes to 32 bytes.
- `MEDIA_SIGNING_SECRET` signs short-lived public media URLs for providers such as TikTok that fetch files from your domain. If omitted, the app falls back to `SESSION_SECRET`, but a dedicated value is better for production.
- `APP_BASE_URL` should be your real HTTPS app URL before you attempt live OAuth with Instagram, TikTok, or YouTube.
- `APP_HOST` controls which network interface the local server binds to. Leave it at `127.0.0.1` for local-only use, or set it to your Tailscale IP if you intentionally want private tailnet access.

## Docker

```powershell
docker build -t signal-stack .
docker run --rm -p 8032:8032 signal-stack
```

## Storage

- App state lives in `.local/data/app-state.json`
- Uploaded media lives in `.local/uploads/`

Those folders are intentionally ignored by git.
