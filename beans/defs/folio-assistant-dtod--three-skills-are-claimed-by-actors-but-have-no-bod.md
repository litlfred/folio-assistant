---
# folio-assistant-dtod
title: Three skills are claimed by actors but have no body anywhere
status: todo
type: task
created_at: 2026-09-18T20:29:27Z
updated_at: 2026-09-18T20:29:27Z
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
- [ ] each of the three has an instruction body, or is deleted as not a real skill
- [ ] whichever exist are carried by the role named above
- [ ] `kg:audit` shows them reachable and servable
