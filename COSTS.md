# Costs and API call estimates (plain language)

This page lists what could cost money as we build the Buffer replacement. All prices are estimates to help you budget; you can pick cheaper/freer options where possible. Call counts assume **about 10 scheduled posts per day across 7–8 accounts** (mix of X, Instagram, YouTube/Shorts, TikTok, Bluesky, Threads).

## What you might pay for
1. **APIs**: Some platforms charge for higher access or higher limits (notably X). Others are free but require developer apps.
2. **Hosting**: Static site is free on GitHub Pages today. A small backend/worker and a database may cost a few pounds/dollars per month once we add them.
3. **Storage**: Only needed if we cache media; small amounts are cheap, and we can start without it.

## Per-platform notes (rough monthly ranges)
- **X (Twitter)**: Higher tiers are paid. Expect at least one **paid tier** if we need reliable posting and media upload across multiple accounts. Plan for **£100–£150+** per month depending on tier and usage. Each post can be 2–3 API calls (upload media, create post, check status). For 300 posts/month, estimate **~900 calls**.
- **Instagram (Business)**: Graph API is free once the app is approved. Calls per post: media upload + publish (~2–3 calls). For 300 posts/month, **~900 calls** (no direct cost, but rate limits apply).
- **Threads**: Similar to Instagram Graph; currently free. Call pattern similar to Instagram (~2–3 calls per post). **~900 calls** for 300 posts.
- **YouTube + Shorts**: Free within quota. Uploads have higher quota units, so avoid re-uploads. Calls per video: upload + set metadata/schedule (~2–3 calls). For 100 videos/month (mix of Shorts and full videos), **~300 calls** within free quota.
- **TikTok**: Developer API is currently free for typical usage. Calls per video: upload + publish (~2–3 calls). For 100 videos/month, **~300 calls**.
- **Bluesky**: Posting is free. One call per post plus optional media upload (~1–2 calls). For 300 posts/month, **~600 calls**.

## Hosting and infrastructure (future phases)
- **Static preview (now)**: Free on GitHub Pages.
- **Backend + worker**: A tiny VPS or managed app could be **£5–£20/month** when we add scheduling/auth. Can pause until code is ready.
- **Database**: Small Postgres (or similar) **£5–£15/month** if/when we store schedules and tokens.
- **Object storage (optional)**: For caching media, budget **£1–£5/month** at low volume.

## How to save money
- Keep using the static preview (free) until backend code lands.
- Batch uploads so we reuse media across accounts to cut call counts.
- Use free tiers where possible (Instagram/Threads/TikTok/Bluesky/YouTube quotas). Only pay for X’s tier when you’re ready to post there.
- Start with a single small server and scale only if post volume grows.

## What I’ll do next regarding costs
- Call out any new paid items as we add APIs.
- Add exact variable names for secrets and toggle expensive features (like X uploads) so you can enable them only when needed.
