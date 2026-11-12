---
# folio-assistant-36f6
$schema: bean/1.0.0
title: 'Memory: Owner 2026-11-11 10:39Z (card B): never merge a draft on fast-tier green; mark ready, wait for full tier on the PR; plus pin-agreement gate'
status: completed
type: task
priority: low
created_at: 2026-11-11T10:40:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `merge-full-tier-rule.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner 2026-11-11 10:39Z (card B): never merge a draft on fast-tier green; mark ready, wait for full tier on the PR; plus pin-agreement gate

Owner card 2026-11-11 10:39:21Z chose "B: A plus pin check" for "stop red main runs before failure emails go out".

- A: never merge a PR whose green comes from the draft fast tier. Mark it ready first, wait for the full tier (the shard jobs) to succeed on the PR, then merge. The merge helper m.sh enforces this: on a draft it only marks ready, and it refuses to merge if the shard jobs were skipped.
- B: a cat-harness-tools gate that fails a PR whose index.lock.json harness pins disagree (dispatched 10:40Z).

**Why:** who-iris main went red at a43a4d27 (7 tests, skewed pins) after I merged a draft on fast-tier green. Failure emails followed. The owner wants failures fixed, not silenced.
**How to apply:** every merge, and every helper agent that merges. Taps saying "when green" mean full-tier green. See folio-assistant-wmmg, folio-assistant-fofz.

Render watch (owner card 10:37Z, A): the merge manager compares each site's main against gh-pages. If main is merged but not live after 2h, or a publish run failed, it sends a fixer and tells the owner. Script: scratchpad render-watch.sh. smart-trust, smart-trust-demo and who-iris have no publish-on-merge (manual stage-local).

Publish drift root cause (2026-11-11 10:45Z): the tools document template switched to push-on-main on 11-10 (111cc87e) and only dth-hrh, dth-sc and dth-phc got it. The fhir-harness IG template (templates/ig-repo-site/site-publish.yml) is still manual-only, so all smart-* IG repos are manual. Ten repos have no publish workflow at all. Card Q-PUB (cmsg_017WNUkNK8kdDziPK58Pv6G9N3D9Su9Ji3Fg4BzUXja2ME): A = one shared workflow plus a drift gate (agent building it).
Mechanism: under release-gated CI (Q-CIB-4 A, 11-08), only PRs labelled `release` run the full tier (shards). So for the full-tier rule, m.sh adds the `release` label and re-runs the whole PR checks run (not just the failed jobs), then merges once the shards pass. fa's CI runs on ready_for_review instead.
Freshness rule (owner card 10:56:59Z, A): a re-pin PR must move every pinned harness to its current main. tools#1881 gates both agreement and freshness. Today it flags dth-hrh (smart-ra pin diverged), smart-trust (bootstrap 12fa6d57 too old) and fa (bootstrap 823e7921).
- A re-run reuses the original event's labels, so adding `release` and re-running does NOT start tools' full tier. Use update-branch (a real merge from main) when the PR is behind. dth-hrh starts its full tier on ready_for_review instead.
- ORDER: add the `release` label BEFORE marking a draft ready (m.sh does this now). Labelling after the ready event starts nothing (`labeled` isn't a trigger), so the PR waits until it's behind main and can be update-branched. Fix in progress: a tools PR adding the `labeled` trigger, guarded to the release label.
