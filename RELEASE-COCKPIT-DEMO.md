# Signal Stack Release Cockpit Demo

Demo: Midnight Signal Vol. 001 - Rain Grid
Status: demo-ready proof
Last updated: 2026-05-02

## Narrow Product Story

Signal Stack is a faceless studio release cockpit.

It is not a generic creator suite. For this proof, it does one valuable job: it turns a faceless media release from a loose idea into a publish-ready package that an operator can inspect, route, validate, and export without waiting for live platform authentication.

The wedge:

1. Take one media concept.
2. Attach the asset-pack plan.
3. Convert it into release metadata and platform briefs.
4. Queue the hero release, Shorts cutdown, and capture CTA.
5. Keep every live post action in dry-run until credentials and approvals exist.

## Demo Source

Source bundle:

Private Midnight Signal handoff bundle in AW2. The exact internal paths are recorded in the private Website Manager handoff and Postgres task, not in the public-safe repo demo.

Key inputs:

1. `release-brief.md` - editorial idea, tone, bundle promise, launch window, CTA.
2. `media-pack-offer-skeleton.json` - offer title, audience, promise, price hypothesis, asset lists, metadata, capture CTA.
3. `download-pack-manifest.json` - buyer-facing pack structure and included artefacts.
4. `signal-stack-release.json` - Signal Stack-compatible release handoff.

Importable demo queue:

`demo/midnight-signal-release-cockpit.queue.json`

## Concrete Demo Path

### 1. Idea

Queue item:

`Midnight Signal Vol. 001 - release idea intake`

Purpose:

Show the start of the cockpit flow: one faceless release idea with a clear tone, audience, and story.

Operator proof:

The queue card stores the release brief path and keeps the item in `Idea`, so the product is visibly managing the early release decision rather than pretending the assets already exist.

### 2. Asset Pack

Queue item:

`Rain Grid asset pack assembly`

Purpose:

Show the release becoming a concrete asset pack: soundtrack, preview cut, loop edit, cover, wallpaper, hero video, Shorts variants, and download notes.

Operator proof:

The item references the offer skeleton and download manifest, uses the `Midnight Signal / Asset Pack` group, and remains in `Draft` until assets are confirmed.

### 3. Release Metadata

Queue item:

`Midnight Signal Vol. 001 | Rain Grid`

Purpose:

Show the hero video brief with YouTube-ready metadata: title, tags, playlist, private privacy setting, not-made-for-kids audience flag, thumbnail, source media, and release notes.

Operator proof:

The item sits in `Approved`, not posted. The dry-run route can be reviewed without YouTube auth.

### 4. Publish-Ready Package

Queue item:

`Get the Rain Grid pack`

Purpose:

Show the launch CTA package: Shorts/Instagram/TikTok/X routing, vertical asset references, platform-specific settings, and demand-capture tracking key.

Operator proof:

The item sits in `Scheduled`, but still uses dry-run. It demonstrates the release cockpit without activating external posting, paid checkout, or YouTube authentication.

## Demo Script

1. Start Signal Stack with `start.cmd`.
2. Open `http://127.0.0.1:8032/`.
3. Use `Import Queue`.
4. Select `demo/midnight-signal-release-cockpit.queue.json`.
5. Search for `Midnight Signal`.
6. Open each queue item in order:
   `Idea -> Asset Pack -> Hero Release -> Capture CTA`.
7. Use `Review Runs` / inspector to show the route truth and dry-run readiness.
8. Use `Export Queue` to show the publish-ready package can leave the cockpit as JSON.

## Demo Guardrails

1. Do not wait for YouTube auth.
2. Do not activate checkout.
3. Do not post externally.
4. Do not reposition Signal Stack as an all-purpose creator suite.
5. Keep the proof framed as `faceless studio release cockpit`.

## Website CTA Story

Website Manager can use this demo as a launch CTA:

Primary CTA:

`See the Rain Grid release cockpit`

Support copy:

`Watch how Signal Stack turns one faceless media idea into an asset pack, release metadata, Shorts routing, and a publish-ready launch package without needing paid tools or live posting credentials.`

CTA target:

For the first public-safe launch, point to a static story page or screenshots, not the private local cockpit.

Recommended page shape:

1. Hero: "A faceless studio release cockpit for Midnight Signal."
2. Four-step proof: Idea, Asset Pack, Release Metadata, Publish-Ready Package.
3. Screenshot strip from Signal Stack once captured.
4. Download-interest CTA for the media pack.
5. Tool-interest CTA for Signal Stack.

## Acceptance Summary

Signal Stack is demo-ready for the launch-to-revenue wave because the repo now contains a real importable demo queue and a narrow story that maps Midnight Signal Vol. 001 from idea to publish-ready package while keeping live posting, paid tools, and checkout out of scope.
