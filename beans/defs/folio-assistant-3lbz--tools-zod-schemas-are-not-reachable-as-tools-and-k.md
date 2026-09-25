---
# folio-assistant-3lbz
title: 'TOOLS: Zod schemas are not reachable as Tools, and kg-navigation has none — audit + analysis'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T05:16:23Z
updated_at: 2026-09-20T05:21:39Z
parent: folio-assistant-zzmr
---


**Asked by the owner, 2026-09-20**: *"all zod usage is associated with skills
and put in tools? (like validate node in graph, or so) in kg-navigation?"* —
and, on shape: *"a Tool per Zod schema... no, but there should be common
patterns (single pattern?) with some parameters more or less"*.

Analysis: `cat-harness/docs/proposals/zod-schemas-as-tools.md`, attached to
[#223](https://github.com/litlfred/folio-assistant/issues/223), whose text
already carries the requirement — *"must constrain Skills i/o with schemas
(json,.ts)"*.

## Measured 2026-09-20 — re-run on `c7b5d9a6` after #437

| | |
|---|---|
| exported `*Schema` consts | 199 |
| with a direct non-test parse call site | 39 |
| composed into a parsed parent (indirect) | 94 |
| exported, ≤2 mentions — candidates for orphaned | 66 |
| Zod schemas that are KG Tool nodes | 3, all *publishing* JSON Schema |
| Tool nodes that validate | **0** |
| Tool nodes bound to `kg-navigation` | **0** |
| gates derived from the workflow | 41, of which **0** are Tool nodes |

## The finding that corrects the record

`SkillDefinition.schemas` (`SkillSchemaRef`) exists and 11 of 22 skill modules
declare one. Its only referencing code is `scripts/generate-docs.ts` — **which
nothing invokes**: no `package.json` entry, no workflow, and its output
directory `schemas/generated/` does not exist. Its render line is also
`d.schemas.join(", ")` over objects, i.e. `[object Object]` if it ever ran.

So three fields believed to have one reader have **none**: `schemas`,
`degradation`, `fallbackRole`. Beans `85e8`, `wlqd`, `nup0`, PRs #450/#452 and
the `qa-report-signing` skill all say "the only reader is generate-docs.ts,
which renders it". The skill is corrected in this change; the beans are
historical record and stay as written.

## Route recommended

**A then B**, per the proposal. A = one parameterised Tool keyed on GRAPH KIND,
because `GraphKindRegistry` already declares every kind and carries no schema
reference — that one missing field is the parameter. B = bind the 41 existing
gates as Tool nodes, which adds discoverability rather than capability.

## Done when

- [x] the audit is written down with its method, including which numbers are proxies
- [x] the overstated "only reader" claim is corrected where an agent will read it
- [ ] the owner picks a route (A then B recommended), or says to stop at the analysis
- [ ] `generate-docs.ts` is wired or retired — **not** to be deleted unilaterally

## Not doing

Removing the 66 near-orphans. The proxy is crude and an exported schema with no
caller may be a published contract for a downstream instance, which is what
`kg:schema` exists for.


## Re-measured after the #437 restructure

PR #437 merged mid-review and moved the instance under `cat-harness/`, so every
path in the first pass stopped resolving. Re-ran the whole scan on `c7b5d9a6`
rather than prefixing the numbers: **199** exported schemas (was 198) and **94**
composed (was 93) — the restructure brought one more schema. Everything else is
unchanged, including the finding that nothing invokes
`cat-harness/scripts/generate-docs.ts`.

Paths in the proposal are now the post-move ones. A proposal whose paths do not
land is the failure #457 was about.
