---
# folio-assistant-zhg2
title: 'REFERENCE DIRECTION: generalise bootstrap''s no-upward-reference rule to all 17 instances, sharing check:partition''s direction computation'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T22:51:10Z
updated_at: 2026-09-24T11:52:37Z
parent: folio-assistant-vke6
---

## State — delivered, advisory, green. Not merged.

Issue #1219, PR #1222, `bun run gates` 139/139, 34 tests in 194ms on synthetic trees.

## The rule

Owner, 2026-09-23: *"if sub1 depends (directly or through chain) stub0, no references/context etc points stub0 → sub1."* `bootstrap-tools/schemas/graph.test.ts` enforces it for ONE instance (`iwtn`); this generalises it to all 17.

## Absorbing `check:partition` = sharing its computation

`schemas/layer-direction.ts` (`directionOf` + `allowedFromNeeds`) already served `check:partition` and `kg-detangle`. This is its third consumer. **The brief recorded `check:partition` at 35 edges from this bean's sibling `zlmp`; it is at 0/0 and enforcing** — so it is untouched and the new check registered separately.

## Findings: 1,424 → 574

Every reduction was a file that **declares itself** generated — no thresholds, no path rules.

| step | wrong-direction |
|---|---:|
| start | 1,424 |
| `$schema` declared `writtenBy` (registry) | 961 |
| `_generated` + skill/schema mirrors | 729 |
| UML overview | 534 |
| after merging `origin/main` | 573 |
| `rootForScope` fix | **574** |

343 of the 574, in 51 files, are `PENDING`.

## Three self-declarations the check reads

`$schema` declared `writtenBy`; a top-level `_generated`; `generated:` front matter. All pre-existing conventions. Three is arguably two too many — issue #1254 / bean `ws99`.

## Two findings for the owner

1. **`check:partition` scans only `cat-harness/`**, so it cannot see cross-instance imports. 8 real wrong-direction imports (`cat-harness → folio-assistant-core`) are invisible to it. The two axes share `directionOf` but are fed different layer assignments — absorption is half done.
2. **"Move the docs up" is the right verb for fewer files than the count suggests.** Of 116 single-destination files, 59 are code files whose mention is a passing comment (moving them would invert a build dependency); and `resolveSkillDirs` walks *dependencies*, so moving a skill up hides it from every layer between.

## Done when

The owner rules on the 116 (move vs reword), `PENDING` reflects it, and the advisory entry flips to `kind: "gate"` pointing at `check:reference-direction:strict` once the count is zero.

No `beans/workflows/` instance recorded: the workflow engine is driven by MCP tools this session does not hold, and hand-writing a state file the engine did not produce would make the store say something no process did.
