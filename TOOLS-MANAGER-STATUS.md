# Tools Manager Status

Updated: 2026-04-11
Tool: Signal Stack
Slug: `signal-stack`
Owner session: `signal-stack-session`

## Current State
- RAG: `Amber`
- Completion: `88%`
- Phase: `execution-pass-complete`
- Install or build state: Local-first Node app + offline web studio + dry-run scheduler
- Last reviewed: `2026-04-11`

## Shipped
- Real creator pipeline: `idea -> draft -> approved -> scheduled -> posted`
- Week and month calendar views wired to the pipeline
- Structured platform targets, account routing, uploads, import/export, and offline shell
- Dry-run scheduler with retries, alerts, activity log, and honest connector gating
- New execution-history pass:
  - per-post `publishHistory` recorded on success, retry, failure, and validation-blocked runs
  - new inspector `Runs` tab with route summaries, latest result details, and timeline cards
  - queue-level `Review Runs` action for direct access to delivery evidence

## Top 5 Risks / Gaps
- Live publishing for `Instagram`, `TikTok`, and `YouTube/Shorts` is still not real end to end because platform credentials, OAuth, and approval are external blockers.
- Existing seeded/local posts created before this pass do not automatically have historical run timelines until the scheduler touches them again.
- Tests are still strongest around validation and scheduler logic; there is not yet automated browser coverage for the new inspector flow.
- Local JSON + local uploads are honest and launchable for a creator desktop workflow, but they are not yet hardened for multi-user hosted production.
- Some platform rules remain conservative warnings rather than hard verified constraints, which is correct for honesty but still leaves product judgement in the loop.

## Execution Pass
- Chosen chunk: deepen the best honest workflow rather than pretending live connectors are finished.
- Executed chunk: publish execution history and delivery inspection across scheduler, data model, and UI.
- Outcome: dry-run publishing is now auditable per post instead of only visible through the global activity feed or last-result state.

## Evidence
- `node --check web/app.js`
- `node --check server/scheduler.mjs`
- `node --check server/connectors.mjs`
- `node --check shared/validation.js`
- `node --test`
- Route checks:
  - `GET /api/health -> 200`
  - `GET /api/bootstrap -> 200`
  - `GET /web/ -> 200`
- Browser evidence:
  - inspector now shows a `Runs` tab
  - a real API-seeded due dry-run item (`Manager execution history smoke post`) was processed through `Run Due Now`
  - the `Runs` panel showed `Posted`, route details for Instagram, the dry-run provider message, and a `1 recorded run` timeline entry
  - browser console errors: `0`

## Remaining
- Real YouTube/Shorts live connector completion
- Real Instagram publish connector completion
- TikTok draft/direct connector completion with honest review constraints
- Better automated UI verification for run-history and routing flows

## Blockers
- External only: platform app credentials, OAuth setup, and provider review/approval for live publishing.

## Next Actions
- Highest-value next product chunk: finish the `YouTube / Shorts` live connector end to end, because it has the clearest official path and the current app already collects the needed target metadata.
- After that: Instagram live publish path, then TikTok draft-first.

## Dependencies
- None

## Surfaces
- Repo: https://github.com/koltregaskes/signal-stack
- Public: https://koltregaskes.github.io/signal-stack/
- Private: file:///W:/Repos/_My%20Tools/signal-stack/web/index.html

## Related Status Docs
- RELEASE-STATUS.md

## Durable Handoff
- Outcome: execution visibility is materially deeper; dry-run publishing now leaves per-post evidence instead of feeling opaque.
- Risk: live connector work is still externally blocked, so this pass intentionally strengthened the honest shipped workflow rather than faking connector readiness.
- Next action: wire the real `YouTube / Shorts` connector once credentials are available.

## Notes
- This is the standard repo-root manager snapshot for the Tools side.
- The private Tools Hub and local session inbox should treat this file as the canonical repo-level manager note.
- No separate session JSON artifact is used in this repo today.
