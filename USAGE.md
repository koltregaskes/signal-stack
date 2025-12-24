# Usage (planned)

The app is focused on scheduling and publishing. This guide describes the intended workflows once the product is built.

## Compose and schedule
1. Open the unified composer and choose target accounts or saved groups (news, art/video, forwards).
2. Enter text and attach media. The UI will show required fields per platform (e.g., quote toggle for X, Shorts toggle for YouTube, captions for Instagram/Threads).
3. Fix any validation warnings (file size, aspect ratio, duration). Where possible the app will auto-resize images to meet limits.
4. Pick a time slot or drop the post onto the calendar. Drag to reschedule as needed.

## Move or clone posts
- From the calendar, select a scheduled post and choose **Move/Clone** to send it to another account (e.g., between X profiles) while reusing uploaded media.

## Calendar view
- Switch between week/month views, filter by account group, and drag posts to new times. Time zones are respected based on your profile settings.

## Platform-specific actions
- **X**: Use the "Quote this post" toggle when pasting an X link so it is treated as a quote with optional media.
- **YouTube**: Use the Shorts vs. standard toggle to publish teasers as Shorts and full videos as standard uploads; scheduling uses `publishAt` when supported.
- **Instagram/Threads/TikTok/Bluesky**: Provide captions and media that meet each platform’s limits; the UI surfaces constraints inline.

This document will be updated with exact UI steps and screenshots as features are implemented.
