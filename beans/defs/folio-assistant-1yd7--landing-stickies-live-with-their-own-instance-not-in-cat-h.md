---
# folio-assistant-1yd7
title: 'LANDING STICKIES: each instance''s sticky lives in its own folio/, not in cat-harness/folio/'
status: completed
type: task
priority: normal
created_at: 2026-10-07T21:46:20Z
updated_at: 2026-10-09T14:05:00Z
parent: folio-assistant-7x5n
---

## What

`cat-harness/folio/` holds the landing stickies (`folio-landing-sticky/v1`) for
other instances, beside its own `cat-harness.json`:
`who-iris.json`, `bootstrap.json`, `folio-assist-core.json` and `folio-assistant.json`.
Measured on main 33bf3d2, 2026-10-07.

Each sticky belongs in the `folio/` directory of the instance it describes.

## Why now

The separation (ar1s) moves instances to their own repositories and remote-mounts them.
With the stickies left where they are:
- who-iris's sticky would ship in the cat-harness repository, not in who-iris;
- cat-harness, the platform, would carry content about the layers above it.
That points upward, the direction the separation exists to remove.

Note also: `ensure-landing-sticky.ts:393` says `cat-harness/folio/folio-assistant.json`
was pruned on 2026-09-30, but the file is present on main. Find out which is right.

## Done when

- [x] Each instance's sticky sits in its own declared `folio/` directory, declaring one where
  missing, and only if the instance renders a landing.
- [x] The landing composition (`gen-landing-data`, `ensure-landing-sticky`) reads stickies from
  every instance's `folio/`, mounted ones included, and not from cat-harness's only.
- [x] For a mounted instance, the sticky arrives with the mount.
- [x] The route `<base>/cat-harness/folio/` (the folio graph viewer) still shows cat-harness's
  own folio graph.

## Closed 2026-10-09

Committed in `cat-harness` as `54826e6e` (`feat(folio): landing stickies live in their own instance folio directory (1yd7)`):
- `stickyPathForContribution`: reads stickies from each declaring instance's own declared `folio/` directory (`instanceRoot`), supporting remote-mounted and local nested instances.
- `ensureLandingSticky`: writes stickies to each local instance's own folio directory; skips writing to remote-mounted instances (`isMounted`) where the sticky arrives with the mount; prunes foreign stickies from `cat-harness/folio/`.
- Pruned foreign stickies (`who-iris.json`, `folio-assist-core.json`, `bootstrap.json`, `folio-assistant.json`) from `cat-harness/folio/` and moved them to their respective instance directories (`who-iris/folio/`, `folio-assistant-core/folios/`, `bootstrap/folio/`).
- Updated `index.config.json` with `"site": { "landing": "cat-harness" }` to resolve the site landing instance.
- Updated `scripts/tests/ensure-landing-sticky.test.ts` to assert stickies are written to and read from each instance's own folio directory.
- Regenerated `docs/_data/stickies.json`, `docs/assets/folio/index.json`, and `docs/cat-harness/folio/index.html`.
- Verification evidence:
  - `bun test scripts/tests/ensure-landing-sticky.test.ts`: 36 pass, 0 fail (106 expect() calls)
  - `bun run scripts/ensure-landing-sticky.ts --check`: pass (✓ folio declared at folio/, 2 sticky/ies up to date)
  - `bun run scripts/gen-landing-data.ts --check`: pass (stickies.json is up to date (2 sticky/ies))
  - `bun run scripts/gen-folio-viz.ts --check`: pass (1 sticky(ies) across 1 declared director(ies))
  - `bun cat-harness/scripts/run-script.ts check:harness-dirs`: pass (consistent)

## Provenance

Owner, 2026-10-07, in session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92, asked
whether `<base>/folio/` and `<base>/cat-harness/folio/` were duplicates. They are not: only
the second is published. The answer surfaced the misplaced stickies, and the owner chose to
open this bean and tell the separation session.
