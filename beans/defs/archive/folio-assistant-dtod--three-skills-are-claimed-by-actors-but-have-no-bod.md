---
# folio-assistant-dtod
title: Three skills are claimed by actors but have no body anywhere
status: completed
type: task
priority: normal
created_at: 2026-09-18T20:29:27Z
updated_at: 2026-09-18T22:02:54Z
---

Found while splitting `actors[].capabilities` (bean `ind9`). Three names were sitting in that field and are neither environment probes nor permissions — they are **skills that do not exist**. No `.md` body, no `schemas/skills/<name>/` directory, nothing `skill_fetch` can serve.

| name | claimed by | the role that should carry it |
|---|---|---|
| `cql-authoring` | `fhir-modeller` | `fhir-modeller` |
| `data-dictionary-authoring` | `business-analyst` | `business-analyst` |
| `lean-diagnostics` | `lean-mcp` | `lean-toolchain` |

They were dropped from `capabilities[]` rather than relocated: claiming an unmodelled thing is worse than not claiming it, and putting them on the role would fail `role-skills-resolve` (critical). Contrast the three that WERE real skills in the wrong field — `bpmn-authoring`, `dmn-authoring`, `terminology-management` — which their roles already carried, so removing them lost nothing.

Related: 27 `skill-servable` findings name twelve more skills that six diagrams reference and no local package serves. Same shape — a body somebody has to write.

## Done when
- [x] each of the three resolved — none is a separate skill
- [x] two are facets of skills that now have bodies; the third is a capability
- [x] `kg:audit` clean — `skill-reachable` and `skill-servable` both pass

## Summary of Changes

**None of the three is a separate skill, and the schemas say so rather than my
asserting it.**

| name | verdict | evidence |
|---|---|---|
| `cql-authoring` | a facet of **`l3-fhir-authoring`** | `schemas/skills/l3-fhir-authoring/input.schema.json` already carries `cql` among its artefact types |
| `data-dictionary-authoring` | a facet of **`l2-dak-authoring`** | `schemas/skills/l2-dak-authoring/input.schema.json` already carries `data-dictionary` as a DAK component |
| `lean-diagnostics` | not a skill — a **capability** | it is what the `lean-mcp` MCP server provides ("Lean 4 proof checking and diagnostics via MCP"), and that capability is already declared in `.claude/skills/capabilities/lean-mcp.json` |

Both parent skills now have instruction bodies (bean `x180`) and each says so
explicitly, so an agent that goes looking for `cql-authoring` or
`data-dictionary-authoring` is told where the guidance actually is rather than
finding nothing.

Nothing was written for the three names themselves. Creating three thin skills
to make a check pass is the failure `ind9` avoided with the 19 capability
probes, and it would have been the same mistake here: the work is real, but it
is not a separate unit of guidance.
