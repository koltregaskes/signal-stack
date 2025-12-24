# Troubleshooting

The product is not implemented yet. This guide lists likely issues to watch for once code is in place. Everything is kept simple and non-technical.

## Common setup issues
- **Missing environment variables**: Make sure platform API keys, database URLs, and storage credentials are set in `.env`. Keep `.env` out of git.
- **OAuth callback errors**: Confirm redirect URLs in each platform’s developer settings match the app’s URLs exactly.
- **Media upload failures**: Check file size, duration, and aspect ratios match platform limits. Ensure storage credentials are correct.
- **Time zone mismatch**: Verify your profile time zone is set correctly so scheduled times land where you expect.

## Scheduling and publishing issues
- **Post stuck in queue**: Confirm the worker/queue service is running and can reach Redis.
- **Rate limits**: Platforms may throttle requests. The app will retry with backoff; if it still fails, spread out posts or reduce simultaneous uploads.
- **Clock drift/time zones**: Ensure server time is synced (NTP) and your profile time zone is correct.
- **Media rejected mid-publish**: If a platform rejects media, the UI will show the reason (size, length, format). Fix and retry; the draft is kept.

## Getting help
If you hit an issue not listed here, capture the error message and recent actions taken so we can expand this guide.
