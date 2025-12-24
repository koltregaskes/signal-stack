# Troubleshooting

The product is not implemented yet. This guide lists likely issues to watch for once code is in place.

## Common setup issues
- **Missing environment variables**: Ensure platform API keys, database URLs, and storage credentials are set in `.env`.
- **OAuth callback errors**: Double-check redirect URLs configured in each platform’s developer settings.
- **Media upload failures**: Verify file size, duration, and aspect ratios meet each platform’s limits; confirm object storage credentials are valid.

## Scheduling and publishing issues
- **Post stuck in queue**: Check the worker/queue service is running and has access to Redis.
- **Rate limits**: Platforms may throttle requests; implement retries with backoff and surface errors in the UI.
- **Clock drift/time zones**: Ensure server time is synced and scheduling respects the user’s time zone.

## Getting help
If you hit an issue not listed here, capture the error message and recent actions taken so we can expand this guide.
