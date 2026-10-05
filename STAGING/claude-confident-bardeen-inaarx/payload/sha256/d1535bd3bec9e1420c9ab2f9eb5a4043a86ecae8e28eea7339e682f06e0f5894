---
# folio-assistant-j7ql
title: 'S4-b: fold agent-skills and large-datasets into cat-harness concern groups (38 rows)'
status: completed
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-02T08:59:13Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-hx65
---

Story S4 (rfuq). Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — pr '(7x5n S4 subgraph ruling)': agent-skills MOVE 21; large-datasets MOVE 11 + CODE 4 (-> cat-harness-tools) + 2 (-> sci / who-iris). Owner: both become cat-harness subgraphs, DISSOLVED into the eight concern groups (Q5). Done in #1776: large-datasets core import 1->0. Remaining: drop needs: folio-assistant-core; gen-id-lookup SOURCE='who-iris' and prose naming core; retire both declarations once empty (deletion needs owner OK).
## Done when
- [x] all rows moved; declarations retired with owner OK — #1787 (merged c6d23ba), #1845 (merged 95c5ca4)
- [x] gates green; merged — every CI job green on a2e9fe5 (#1787) and ae1a406 (#1845)

_2026-10-01T13:47:13Z_ — Claimed by claude/blissful-ride-c2f26u-s4b-fold — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Progress 2026-10-01 (PR #1787)

All 38 audit rows are moved, plus the residue. Where the moves departed from the audit's targets is explained in the PR body.

- library: 14 → `cat-harness/library/<slug>/`, flat until PR8 `f8wp` regroups. The summary hold carries over per entry via the new `heldEntries`.
- voices: 7 → `cat-harness/skills/voices/`, declared from within `cat-harness/skills/skills.json`.
- skills: 5 + manifest → `cat-harness/skills/library/large-datasets/`.
- processes: 5 → `cat-harness/processes/`.
- schemas: 5 → `cat-harness/schemas/`. `id-lookup.test.ts` → `cat-harness-tools/test/`.
- code: gen/bench-id-lookup → `cat-harness-tools/scripts/`; lookup.js, .d.ts and index.html → `cat-harness-tools/id-lookup/`.
- per-corpus: `who-iris/sources/`, `who-iris/id-lookup/` (generated), `folio-assistant-sci/sources/`.

The upward name `SOURCE = "who-iris"` is gone. The generator now indexes every instance that declares a directory with id `id-lookup`.

**Owner approval recorded (2026-10-01, relayed by the lead session):** delete exactly these 5 dead kg-qa sidecars, and nothing else:
`cat-harness/test/results/kg-qa/_external/large-datasets/processes/{copy-out-materialized,materialize-remote,refresh-materialized,sample-import,subscribe-kg}.kg-qa.json`.
They audited the five diagrams from outside. Their subjects now live in `cat-harness/processes/`, whose own sidecars were relocated with them. Deleted in #1787.

## Awaiting the owner: retiring the two former instances (listed, NOT deleted)

Every file below is all that remains. Each declaration is emptied (`directories: []`, `needs: ["cat-harness"]`). The root `folio-assistant.json` `needs` still lists both, and would lose those two entries on retirement.

| bytes | path |
|---|---|
| 2338 | agent-skills/AGENTS.md |
| 4975 | agent-skills/README.md |
| 3325 | agent-skills/agent-skills.json |
| 2954 | agent-skills/library/README.md (generated) |
| 787 | agent-skills/skills/skills.json |
| 2333 | agent-skills/skills/voices/README.md (generated) |
| 1448 | agent-skills/test/results/README.md (generated) |
| 214 | agent-skills/test/results/kg-qa.manifest.json |
| 5314 | agent-skills/test/results/kg-qa/scenarios/kg.kg-qa.json |
| 2770 | large-datasets/AGENTS.md |
| 6569 | large-datasets/README.md |
| 981 | large-datasets/id-lookup/README.md (generated) |
| 3256 | large-datasets/large-datasets.json |
| 2608 | large-datasets/processes/README.md (generated) |
| 954 | large-datasets/schemas/README.md (generated) |
| 719 | large-datasets/scripts/README.md (generated) |
| 1958 | large-datasets/skills/README.md (generated) |
| 858 | large-datasets/sources/README.md (generated) |
| 1465 | large-datasets/test/results/README.md (generated) |
| 214 | large-datasets/test/results/kg-qa.manifest.json |
| 5035 | large-datasets/test/results/kg-qa/scenarios/kg.kg-qa.json |

That is 21 files, about 51 KB. Retiring would also remove the generated per-instance artefacts named after them: `cat-harness/uml/overview/{agent-skills,large-datasets}*`, their `cat-harness/docs/uml/overview/` pages, and `cat-harness/test/results/{detangle,lsi}/{agent-skills,large-datasets}/`.

## Completed 2026-10-02

Landed in #1787 (merge c6d23bac, the fold) and #1845 (merge 95c5ca48, deleting the emptied agent-skills/ and large-datasets/ instances, which the owner approved on 2026-10-01). Re-derived from main at 95c5ca48: neither directory exists, and the root `needs` no longer lists either.
