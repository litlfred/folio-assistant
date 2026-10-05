---
# folio-assistant-zhg2
title: 'REFERENCE DIRECTION: generalise bootstrap''s no-upward-reference rule to all 17 instances, sharing check:partition''s direction computation'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T22:51:10Z
updated_at: 2026-10-01T17:41:32Z
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


## Owner rulings 2026-10-01 late (~17:30) — Q-B, reference direction (epic 7x5n)

Source: owner, session_01ToWZR4RgTRCWeSsgxsSQfT. Plan: Q-B (`check:reference-direction` baseline, ratchet, CI, then drain).

- **Q1: REWORD, not move-to-lowest-common-dependent.** Multi-destination files stay where they are; their prose is rewritten so it does not name higher layers. The "names a chain → moves to the top of the chain" rule is NOT adopted.
- **X3 adopted:** the 3 layering specifications — `cat-harness/scripts/partition/instance-rules.ts`, `smart-base/…/smart-stack-layering.md`, `cat-harness/scripts/check-reference-direction.ts` — are an `EXEMPTIONS` class: their subject IS the instance graph.
- **A.10: the ratchet ALSO covers single-name files** (≈215 baselined), so a new file naming one higher instance fails CI too.
- **X1 adopted:** translation mirrors (the 10 locale copies of `docs/skills.md` / `guides/agent-onboarding.md`, `lang:` ≠ en + `translation_source:`) are exempt — the source page is counted once.
- X2 (exempt dated decision records) was not ruled. Under REWORD, the RD-04 proposals are reworded in place or stay in the baseline.

Implementation: steps (1)+(2) — baseline store, `applyRatchet`, `--seed`, CI step — are the next PR under beans `1bvx`/`vzo5`.
