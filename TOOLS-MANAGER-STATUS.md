# Tools Manager Status

Updated: 2026-04-14
Tool: Signal Stack
Slug: `signal-stack`
Owner session: `signal-stack-session`

## Current State
- RAG: `Amber`
- Completion: `89%`
- Phase: `execution-pass-complete`
- Install or build state: Local-first Node app + offline web studio + dry-run scheduler + explicit host binding
- Last reviewed: `2026-04-14`

## Shipped
- Real creator pipeline: `idea -> draft -> approved -> scheduled -> posted`
- Week and month calendar views wired to the pipeline
- Structured platform targets, account routing, uploads, import/export, and offline shell
- Dry-run scheduler with retries, alerts, activity log, and honest connector gating
- New execution-history pass:
  - per-post `publishHistory` recorded on success, retry, failure, and validation-blocked runs
  - new inspector `Runs` tab with route summaries, latest result details, and timeline cards
  - queue-level `Review Runs` action for direct access to delivery evidence
- New route-readiness pass:
  - shared route-readiness helper now drives both validation and delivery-inspector truth
  - delivery inspector now shows per-platform `Dry run ready`, `Live API ready`, or blocked launch state
  - operators can see missing route, paused account, app-key, auth, or capability blockers without inferring them from scattered badges
- New network-safety pass:
  - backend now binds to an explicit host instead of opening all interfaces by default
  - `start.cmd` keeps the studio localhost-only for normal use
  - new `start-tailscale.cmd` makes private tailnet access explicit when cross-device access is wanted

## Top 5 Risks / Gaps
- Live publishing for `Instagram`, `TikTok`, and `YouTube/Shorts` is still not real end to end because platform credentials, OAuth, and approval are external blockers.
- Existing seeded/local posts created before this pass do not automatically have historical run timelines until the scheduler touches them again.
- Tests are still strongest around validation and scheduler logic; there is not yet automated browser coverage for the new inspector flow.
- Local JSON + local uploads are honest and launchable for a creator desktop workflow, but they are not yet hardened for multi-user hosted production.
- Some platform rules remain conservative warnings rather than hard verified constraints, which is correct for honesty but still leaves product judgement in the loop.
- Tailnet access is now intentional rather than accidental, but the wider Windows listener posture still depends on machine-level policy outside this repo.

## Execution Pass
- Chosen chunk: make connector readiness explicit in the delivery inspector instead of forcing operators to guess from badges and generic checks.
- Executed chunk: locked the backend to an explicit bind host and added a dedicated Tailscale launch path.
- Outcome: Signal Stack can stay localhost-only by default and still be exposed deliberately over Tailscale without reopening itself to every interface.

## Evidence
- `node --check web/app.js`
- `node --check shared/validation.js`
- `node --check server/scheduler.mjs`
- `node --check server/connectors.mjs`
- `node --check server/env.mjs`
- `node --check server.mjs`
- `node --test`
- Route checks:
  - `GET /api/health -> 200`
  - `GET /api/bootstrap -> 200`
  - `GET /web/ -> 200`
  - live service restarted on `http://100.119.231.37:8044`
- Browser evidence:
  - isolated headless Edge verification used a dedicated temporary automation profile, not the live personal profile
  - the `Runs` panel now shows a `Launch truth` section
  - the readiness panel rendered `Dry run ready` and the routed account detail for the seeded Instagram item
  - browser console errors: `0`

## Remaining
- Real YouTube/Shorts live connector completion
- Real Instagram publish connector completion
- TikTok draft/direct connector completion with honest review constraints
- Better committed UI smoke coverage for run-history and routing flows

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
- Outcome: the studio no longer needs to bind to every interface just to support private cross-device access.
- Risk: live connector work is still externally blocked, and machine-level listener policy still needs separate hardening.
- Next action: wire the real `YouTube / Shorts` connector once credentials are available, while keeping the explicit-host launch model.

## Notes
- This is the standard repo-root manager snapshot for the Tools side.
- The private Tools Hub and local session inbox should treat this file as the canonical repo-level manager note.
- No separate session JSON artifact is used in this repo today.
