# Platform API Research

As of April 6, 2026, this is the working decision record for whether Signal Stack should rely on official publishing APIs for Instagram, TikTok, and YouTube/Shorts.

## Executive summary

- Buffer's Free plan is still free, supports up to 3 channels, and allows 10 scheduled posts per channel at a time. Buffer's first paid publish tier starts at $5/month for 1 channel. Source: [Buffer pricing](https://buffer.com/pricing)
- I did not find official per-call or per-post billing for the Instagram publishing API or TikTok Content Posting API. The official docs focus on access, scopes, audits, and rate limits rather than usage charges.
- YouTube Data API uses quota accounting rather than per-upload billing. The default daily quota is 10,000 units, and the official docs currently show `videos.insert` at 100 units, which is roughly 100 uploads per day per project before additional quota is needed. The revision history notes that this was updated from the older 1600-unit cost on December 4, 2025. Sources: [YouTube getting started](https://developers.google.com/youtube/v3/getting-started), [quota cost](https://developers.google.com/youtube/v3/determine_quota_cost), [revision history](https://developers.google.com/youtube/v3/revision_history)

## Cost verdict

Official APIs look viable for a lean product.

- Instagram: no separate usage fee found in the official docs reviewed
- TikTok: no separate usage fee found in the official docs reviewed
- YouTube: quota-governed, not clearly metered per request in dollars

That means the practical costs are mostly:

- app review and compliance work
- OAuth setup
- local or hosted infrastructure
- storage and upload bandwidth
- maintenance when platform policies change

Important note:
I did not find an official Meta or TikTok price sheet stating that these publishing APIs are free. The conclusion that they are effectively free to use today is an inference from official docs that document capabilities and limits without presenting usage pricing.

## Platform matrix

| Platform | Official publishing power | Important limits or gates | Direct cost signal | Decision |
| --- | --- | --- | --- | --- |
| Instagram | Publish single images, videos, reels, and carousels for professional accounts | Professional accounts only; Stories are more limited; 100 API-published posts per 24-hour moving window; app review and OAuth required | No usage pricing found in official docs | Yes, API-first |
| TikTok | Upload as draft and direct post from desktop, cloud, or web apps | Audit and review gates; unaudited clients are restricted; creator posting caps apply | No usage pricing found in official docs | Yes, but ship draft-first if needed |
| YouTube / Shorts | Upload videos, set metadata, and schedule publish time | Unverified projects upload as private only until audit; quota model applies | Default quota 10,000 units/day; upload is 100 units per current quota table | Yes, API-first |

## What the APIs let us do

### Instagram

The official Meta publishing docs say the platform can publish:

- single images
- videos
- reels
- carousel posts with multiple images and videos

The docs also state that publishing is for Instagram professional accounts, and that accounts are limited to 100 API-published posts within a 24-hour moving period. Sources: [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing), [Instagram API documentation on Postman](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)

Practical implication:

- Signal Stack can schedule and publish normal feed content directly.
- We need account-type detection and a guardrail for the 100-post rolling cap.
- Stories should be treated as a secondary surface because access is narrower than standard feed publishing.

### TikTok

TikTok's official Content Posting docs say the API is compatible with desktop, cloud, and web applications, and supports both:

- Direct Post
- Upload as Draft

Direct Post lets the creator post from our app with TikTok-native posting settings. Upload as Draft pushes the media into TikTok for final editing and publishing in TikTok's own creation flow. Sources: [Content Posting API](https://developers.tiktok.com/products/content-posting-api), [Get started](https://developers.tiktok.com/doc/content-posting-api-get-started), [Direct Post reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)

Practical implication:

- We do not need browser automation to get usable TikTok publishing.
- The safest launch sequence is draft export first, then direct posting after audit and compliance are in place.
- TikTok can still be valuable even if the first version stops at "export draft to TikTok."

### YouTube / Shorts

The official YouTube Data API supports:

- video uploads
- metadata updates
- scheduled publishing through `status.publishAt`

The official docs also note that `status.publishAt` only works while the video is private and has not previously been published. Unverified API projects created after July 28, 2020 are restricted to private uploads until they pass audit. Sources: [Videos resource](https://developers.google.com/youtube/v3/docs/videos), [revision history](https://developers.google.com/youtube/v3/revision_history)

I did not find a separate Shorts upload API. The working assumption is that Shorts should be handled as a YouTube upload profile inside Signal Stack rather than as a separate connector. Source: [YouTube Data API](https://developers.google.com/youtube/v3)

Practical implication:

- Long-form YouTube and Shorts can share the same connector.
- Shorts-specific validation should live in our app, not in a separate API integration.
- Quota is unlikely to be a problem for a creator-focused launch unless we move into agency-scale bulk uploads.

## Comparison with Buffer

The cheapest benchmark is Buffer Free, not Buffer paid.

- Buffer Free: 3 channels, 10 scheduled posts per channel
- Buffer Essentials: $5/month for 1 channel on annual billing

Sources: [Buffer pricing](https://buffer.com/pricing)

So the question is not "are the APIs cheaper than free?"
They are not cheaper than free.

The real question is:
"Can Signal Stack use official APIs without adding material variable platform cost?"

Based on the official docs reviewed, the answer is yes.

## Recommended Signal Stack scope

Recommended near-term product scope:

- Keep X and Threads out of scope for native publishing
- Continue using Typefully for X and Threads
- Make Signal Stack API-first for Instagram, TikTok, and YouTube/Shorts
- Treat TikTok direct publishing as a second-stage capability if audit friction is high
- Keep browser automation as a manual fallback only, not the default architecture

Why this scope is strong:

- it avoids the noisiest platform integrations
- it removes the need to build a brittle browser-control core
- it focuses on the media-heavy networks where Signal Stack is most differentiated
- it keeps direct platform cost very low

## Browser automation verdict

Browser automation is still useful, but not as the primary architecture.

It remains a reasonable fallback for:

- account recovery workflows
- supervised publishing when an API capability is temporarily blocked
- one-off platform edge cases

It is a weak default strategy for:

- unattended scheduling
- reliable high-volume posting
- OAuth-safe multi-account flows
- long-term maintenance

## Sources

- [Buffer pricing](https://buffer.com/pricing)
- [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- [Instagram API documentation on Postman](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [TikTok Content Posting API](https://developers.tiktok.com/products/content-posting-api)
- [TikTok Content Posting API get started](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [TikTok Direct Post reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)
- [YouTube Data API getting started](https://developers.google.com/youtube/v3/getting-started)
- [YouTube Data API quota cost](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube videos resource](https://developers.google.com/youtube/v3/docs/videos)
- [YouTube Data API revision history](https://developers.google.com/youtube/v3/revision_history)
