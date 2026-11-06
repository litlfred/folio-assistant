---
# folio-assistant-yeg4
$schema: bean/1.0.0
title: Shared verified layers cache ref
status: in-progress
type: feature
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T13:19:16Z
updated_at: 2026-11-06T00:55:57Z
parent: folio-assistant-k3vv
---

One git ref per lock in the index repo, `refs/cat/layers/<sha256 of the lock's instances>`, plus a moving `refs/cat/layers/main`. Its tree is the composed overlay that mount-from-lock lays down.

- **Reading:** `mount:lock` first tries one shallow fetch of the ref. It verifies every byte against the lock, and falls back to a per-repo fetch for each layer that does not verify. The lock stays the only authority.
- **Writing:** `bun run cat layers:publish` writes the ref, and refuses unless every mount is current. `.github/workflows/layers-cache.yml` runs it on main.
- **SessionStart:** the hook now reports a missing or stale mount loudly (see `folio-assistant-tsh9`).

PRs: litlfred/cat-harness-tools#1506, litlfred/folio-assistant#2971, litlfred/cat-harness#1050.

Measured in a fresh container (12 layers, about 32k files): 69 s fetching each repo, against 27 s on a cache hit.

## Done when
- [ ] folio-assistant re-pins cat-harness-tools past #1506
- [ ] CI timings recorded, with run IDs
- [ ] merge-main, the merge train (#2960) and the CI image (#2961, with CI speed 9) read the cache

_2026-11-05T13:19:16Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for the layers-cache session https://claude.ai/code/session_01VQDpPg3qqw5ugnQBEYASrP, which was launched by https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf at the owner's request.

_2026-11-06T00:55:57Z_ — From the layers-cache session (https://claude.ai/code/session_01VQDpPg3qqw5ugnQBEYASrP), recorded by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk:
- All three PRs are merged: litlfred/cat-harness-tools#1506, litlfred/cat-harness#1050, litlfred/folio-assistant#2971.
- The first ref was written by layers-cache.yml run 42139554746 (dispatched on main): `refs/cat/layers/3d39dd46…` plus `refs/cat/layers/main`, 32,248 files. Publishing took 39 s; the job's own per-repo mount took 36 s in CI.
- In a fresh agent container on the same lock, with no local cache and every byte verified: 62.6 s per repo against 30.7 s from the cache.
- Remaining done-when item: a CI hit timing with a run ID. That will be the next CI mount on this lock, which reports "cached-step `layers`: hit" in its step summary.
