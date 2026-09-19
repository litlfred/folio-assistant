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

## Answered — bootstrap is top-level, and is the ONE exception

Owner, 2026-09-19: "boottreap is top level but will be a part of cat-harness (one exception for top-leve vs repo name)".

THE RULE, stated fully: a top-level directory's name IS a repository name. Exactly one directory breaks it — `bootstrap/`, which sits at top level but SHIPS INSIDE cat-harness.

WHY THE EXCEPTION IS THE RIGHT ONE, and it is not convenience. Bootstrap's whole job is to be readable BEFORE the reader knows which stub to resolve. Putting it at `cat-harness/bootstrap/` makes that circular: an agent would have to already know cat-harness is the harness in order to find the file that tells it what a harness is. Every other directory can be found once you know the instance; this one is what you read to find out.

So `bootstrap/` is top-level for RESOLUTION and part of cat-harness for OWNERSHIP, and those two facts do not have to agree. Worth saying plainly because a later reader will see a top-level directory that no repository is named after and try to tidy it away.

## Still open, and the answer above sharpens rather than settles it

"One exception" and the earlier rule that `beans/` and `todos/` take no stub cannot both be read the loose way. Two readings reconcile them and they lead to different trees:

(a) THEY STAY TOP-LEVEL — then there are three exceptions, not one, and the rule as stated is wrong.

(b) THEY LIVE IN EXACTLY ONE STUB — `cat-harness/beans/`, `cat-harness/todos/`. "Takes no stub pattern" then means what it originally meant: they are never OVERLAID across instances, one directory per instance merging into a whole. That is a different claim from "sits at the top level", and (b) keeps the exception count at one.

(b) is the reading consistent with both statements, so it is what this bean assumes until told otherwise. Recorded rather than silently adopted because it moves two committed stores and every path that reads them, and being wrong about it is expensive.

`fsh-guts/` from PR #403 is a third case the rule has to answer: a top-level directory that is neither a repository name nor bootstrap. Under (b) it is a second exception, which the rule as stated does not allow.

## Answered — beans/ and todos/ stay top-level (reading (a))

Owner, 2026-09-19: "beans/ todos/ stay top-level". This bean had recorded reading (b) as its working assumption and (b) is WRONG. Corrected here rather than edited away, because the next reader should see that the loose reading was tried and rejected.

WHAT THE RULE ACTUALLY IS, restated so it covers every case now known:

The top level holds three kinds of thing.

1. INSTANCE STUBS, each named after the repository it becomes: `cat-harness/`, `f-a-core/`, `f-a-sci/`. This is the set separation walks.
2. NON-INSTANCE STORES that are never overlaid and belong to no single instance: `beans/`, `todos/`, and `fsh-guts/` (PR #403). "Takes no stub pattern" means exactly this — not that they sit anywhere in particular, but that there is one of each and it is not composed from per-instance parts.
3. `bootstrap/` — instance-SHAPED (it ships inside cat-harness) but not named after a repository. This is the one exception the owner named, and it is an exception within category 1, not against the whole top level.

So "one exception for top-level vs repo name" is a claim about the INSTANCE-shaped directories: every one is named after its repository except bootstrap. It was never a claim that the top level contains nothing else.

That reading makes all three owner statements consistent — beans takes no stub, bootstrap is the one exception, top level holds bootstrap/ cat-harness/ f-a-core/ — where (b) had to contradict the first to keep the second.

## What this settles for the migration

The directories that MOVE are exactly the per-instance parts of `docs/`, `tools/`, `skills/`, `schemas/`, `library/`, `voices/`, `translations/`. The stores that DO NOT move are `beans/`, `todos/`, `fsh-guts/`, and `bootstrap/` is already where it will stay.

That is a smaller migration than the first framing implied, and it removes the expensive half: no committed work-plan store moves, so no path that reads a bean or a todo changes, and `.beans.yml` and `WORKFLOW_DIR` — the two duplicates `check:harness-dirs` gates because neither can be removed — are untouched.
