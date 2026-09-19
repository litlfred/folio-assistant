---
# folio-assistant-wggr
title: 'SPLIT: invert the stub pattern — <stub>/docs not docs/<stub>, so a repo is one directory'
status: todo
type: task
created_at: 2026-09-19T11:51:29Z
updated_at: 2026-09-19T11:51:29Z
---

Owner direction, 2026-09-19: "dont do docs/<stub> tools/<stub> etc, rather do <stub>/docs and <stub>/tools. update the references/graph/dirs and then move is much cleaer.... this dir is this repo. and we can do more QA here before separation. so there would be in top-level only bootstrap/ cat-harness/ f-a-core/ etc. all content migrated to respective expexted dirs. also keeps URI/IRIs not so redundant."

## What changes

The stub pattern INVERTS. `docs/<stub>/`, `tools/<stub>/`, `skills/<stub>/` become `<stub>/docs/`, `<stub>/tools/`, `<stub>/skills/`. The top level then holds one directory per instance and nothing else that belongs to an instance.

WHY IT IS BETTER, and each reason is independent:

1. SEPARATION BECOMES A MOVE, NOT A SIFT. Today extracting cat-harness means walking every top-level directory and taking the `cat-harness/` subdirectory out of each. After, it is one `git mv` of one directory. The current `repo-partition.ts` exists precisely because the cut is hard to compute; under the inversion the directory IS the answer.
2. THIS DIRECTORY IS THIS REPO. A reader opening `cat-harness/` sees everything that repository will contain, rather than reconstructing it from eight places.
3. THE IRIs STOP REPEATING THEMSELVES. `.../folio-assistant/docs/folio-assistant/...` is the shape today. The stub appears once.
4. QA BEFORE SEPARATION. Everything can be checked in one checkout while the pieces are still together — which is the argument for doing this BEFORE the split rather than as part of it.

## How to do it, and the order is the whole plan

DECLARATION AND READERS FIRST, FILES SECOND. Update `harness.json`, `schemas/cat-harness.ts` defaults, and every consumer to resolve the new shape while the files are still where they are; verify green; and only then `git mv`. That way the move is the cheap half and the gates prove it landed rather than being the thing that discovers the breakage. The reverse order makes every gate red at once with no way to tell which failure is which.

This is affordable now in a way it was not this morning: `directoryForGraph()` and `kgRoots()` exist and 90 of 127 hardcoded declared-path literals are drained, so most consumers already ask the declaration. `check:declared-paths` names the ones that do not — the remaining 37 are the work list, not a guess.

## Two questions the owner has not answered

- DOES `bootstrap/` BECOME A STUB LIKE THE REST, or stay top-level? It is already in the new shape, which is a useful accident. But it is also the one thing that must be readable BEFORE any stub is resolved, so an argument exists for it being special. Asked, not assumed.
- DO `beans/` AND `todos/` STAY TOP-LEVEL? The owner said earlier they do not take the stub pattern, because they are never overlaid. If that holds, the top level is `bootstrap/ cat-harness/ f-a-core/ beans/ todos/` — five entries, not three.

## Collision to watch: fsh-guts

PR #403 (`claude/brave-hypatia-r820sf`) adds `fsh-guts/` as a NEW top-level directory — the not-rendered store for deprecated material — and moves the four proposals into it. That is a sixth top-level entry and it is not an instance stub, so whatever rule this bean settles has to say where a non-instance top-level directory stands. Verified on the branch, not from its description.

Same PR is a live conflict for a different reason: it deletes `docs/folio-assistant/proposals/`, which now holds `bootstrap.md` created after they branched. Raised on the PR rather than resolved unilaterally.

## Sibling sessions in flight, measured 2026-09-19 ~11:50 UTC

Four PRs opened within the hour, all of which this move would conflict with if it landed first: #410 (roadmap epics, beans only), #409 (readme:audit in CI — which will make a dead README link a RED BUILD once this moves docs), #408 (note anchors), #403 (fsh-guts, above). `ListAgents` reports no live peer session, so coordination is through this bean and the PRs, not messaging.

THE SEQUENCING CONSEQUENCE: this touches nearly every path in the repo, so it should land when the in-flight set is small, and the four above should merge first. A move of this size that jumps the queue costs four sessions a conflict each.
