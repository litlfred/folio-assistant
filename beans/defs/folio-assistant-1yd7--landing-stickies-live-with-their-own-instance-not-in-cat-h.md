---
# folio-assistant-1yd7
title: 'LANDING STICKIES: each instance''s sticky lives in its own folio/, not in cat-harness/folio/'
status: todo
type: task
priority: normal
created_at: 2026-10-07T21:46:20Z
updated_at: 2026-10-07T21:46:20Z
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

- Each instance's sticky sits in its own declared `folio/` directory, declaring one where
  missing, and only if the instance renders a landing.
- The landing composition (`gen-landing-data`, `ensure-landing-sticky`) reads stickies from
  every instance's `folio/`, mounted ones included, and not from cat-harness's only.
- For a mounted instance, the sticky arrives with the mount.
- The route `<base>/cat-harness/folio/` (the folio graph viewer) still shows cat-harness's
  own folio graph.

## Provenance

Owner, 2026-10-07, in session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92, asked
whether `<base>/folio/` and `<base>/cat-harness/folio/` were duplicates. They are not: only
the second is published. The answer surfaced the misplaced stickies, and the owner chose to
open this bean and tell the separation session.
