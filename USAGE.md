# Usage

## Basic flow

1. Open the app.
2. Start in the media-first composer stage and drop in the image, video, or soundtrack reference before you worry about the metadata.
3. Set the quick essentials in the compact sidebar: title, schedule, content group, pipeline status, and media profile.
4. Use the composer tabs to keep the workflow tidy:
   `Platforms`: toggle destinations, route accounts, and open only the platform controls you need
   `Copy`: keep the shared story short, then add overrides only where a target needs them
   `Support`: store remote asset URLs, quote links, and production notes without crowding the main view
5. Use the layout controls in the composer header if you want a faster one-screen working mode:
   `Compact`: tighten spacing across the studio
   `Launch Strip`: collapse the hero area into a slimmer strip
   `Inspector`: hide or reveal the right-side checks and accounts dock
   The active layout and inspector tab persist locally on this device
6. Fill the structured target cards for account routing plus any platform-specific fields:
   Instagram: publish shape, first comment, alt text
   TikTok: post mode, privacy, interaction toggles, commercial disclosure, consent
   YouTube / Shorts: upload title, privacy, audience, tags, playlist
7. Move the item forward through `Idea -> Draft -> Approved -> Scheduled`.
8. Use the week or month calendar to rebalance timing and spacing.
9. Watch the validation rail for blocked items and warnings.
10. Let the scheduler move successful deliveries into `Posted`.

## Accounts

- Every platform route points to an account.
- Accounts can be `Dry run` or `Live API`.
- Default accounts are used automatically for new posts.
- X supports multiple accounts cleanly, so moving a post between them is quick.

## Scheduler

- `Run Due Now` processes due items immediately.
- The background scheduler also checks due items every 30 seconds while the server is running.
- Successful deliveries go to `Posted`.
- Failed deliveries go to `Retrying` or `Failed` and create alerts.

## Imports and exports

- `Export Queue` writes the pipeline as JSON.
- `Import Queue` accepts either a raw posts array or an object with a `posts` array and merges the items back into the studio.

## Local draft persistence

- Composer edits autosave locally in the browser.
- That local draft is restored on the next load before you save it into the shared queue.

## Audio references

- Audio files and audio URLs are supported as local soundtrack references.
- They do not count as primary publish media on their own, so Instagram, TikTok, YouTube, and Shorts still expect an image or video asset before delivery.

## Static preview fallback

If the backend is unavailable, the frontend still loads from cached/demo data so the app remains explorable.
