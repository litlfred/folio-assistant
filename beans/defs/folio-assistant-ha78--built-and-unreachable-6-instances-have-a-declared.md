---
# folio-assistant-ha78
title: 'BUILT AND UNREACHABLE: 6 instances have a declared viewer no tile links, and shipping a graph adds one'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-22T06:49:16Z
updated_at: 2026-09-22T08:58:25Z
parent: folio-assistant-o3xy
---

Surfaced on 2026-09-22 by shipping `agent-skills`' voices (bean `26tu`). The
merge conflict in the generated `docs/_data/harness.json` was main adding this
finding for the new graph; regenerating kept it, because it is TRUE.

`harnessTiles` reports, per instance:

> N graph(s) have a declared viewer that exists but is not at a conventional
> path, so no tile links it — … **Built and unreachable is a different gap from
> unbuilt.**

Measured across the current tree, it now fires for **six** instances:

| instance | graphs |
|---|---|
| `cat-harness` | 2 |
| `who-iris` | 2 (`catalogue`, …) |
| `agent-skills` | 1 (`voices`) — NEW |
| `folio-assistant-core` | 1 |
| `detangle` | 1 |
| `large-datasets` | 1 |

## Why this is a bean rather than a fix in that PR

Shipping a graph does not CAUSE the gap — it joins an existing pattern that
five instances already had. Fixing it means either moving viewers to the
conventional path or teaching the tile model to link a declared non-conventional
one, and that is a decision about the tile model across six instances, not a
side effect of adding a voice.

**The reporting is working as designed.** The finding is emitted rather than
smoothed over, which is the whole point of the distinction it draws. What is
missing is somebody deciding which of the two repairs is right.

## Done when

- [ ] the owner has decided: move the viewers, or teach the tiles to follow a
      declared path
- [ ] whichever way, the count in `docs/_data/harness.json` drops to zero and a
      test pins it there — a finding that is merely rarer is not fixed
