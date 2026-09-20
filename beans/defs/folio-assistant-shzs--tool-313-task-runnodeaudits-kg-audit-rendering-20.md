---
# folio-assistant-shzs
title: 'TOOL 3/13: Task_RunNodeAudits — KG audit & rendering (20 files, 11 entry points)'
status: todo
type: task
priority: high
created_at: 2026-09-20T04:34:12Z
updated_at: 2026-09-20T04:34:12Z
parent: folio-assistant-d308
---

Group 3 of 13 in `d308`. **20 files, 11 entry points.**

`kg-audit`, `check-tools`, `tool-coverage`, `capture-mcp-tools`, `validate-skills`,
`known-skills`, `bpmn-render`, `render-bpmn`, `check-workflow-refs`,
`check-workflow-policy`, `check-mirror-drift`, `check-duplicate-decls`,
`stakeholder-map`, `repo-partition`, `repo-files`, `script-sweep`, `script-walker`,
`refactor-strategy`, `eval-crdm-detect`.

**BPMN:** `review-code · Task_RunNodeAudits` and `Task_ReviewTool` — the process
for reviewing a Tool node. This group audits the graph that would contain it.

**Target repo (#223):** `agentic-harness`.

**The uncomfortable part, recorded so it is not lost:** `tool-coverage.ts`
already tiers every uncovered skill A/B/C/D and says in its own header that tier
A "is the list to act on". It has said so since 2026-09-18 (bean `ce65`, still
in-progress). The instrument for this entire epic existed before the epic did. A
Tool node here is not new capability — it is making an existing answer reachable,
which is the whole thesis of `d308` demonstrated against the repo itself.

## Done when
- [ ] Tool node(s) for the audit family
- [ ] `satisfies` includes `kg-export` and the review skills
- [ ] `tool-coverage` itself reachable as a Tool
- [ ] `ce65` cross-referenced both ways

---

## CORRECTED 2026-09-20: `kg-export` is already covered — rescope to the audits

Five nodes satisfy `kg-export`: `pages-publish`, `serve-rendering`,
`cat-harness-schema`, `tool-schema`, `tool-types-schema`. So this bean's stated
skill is not uncovered, and `tool-coverage` does not list it in tier A.

**What IS uncovered and in tier A: `bpmn-authoring`** (`io-contract, userTask`).
And the audit family itself — `kg-audit`, `check-tools`, `tool-coverage`,
`capture-mcp-tools`, `validate-skills` — is reachable from no Tool node at all,
which is the joke this bean already noted and now has a name for.

## Rescoped

Two separable things were in one bean:

1. **The audit family** — `kg-audit`, `check-tools`, `tool-coverage`,
   `validate-skills`, `check-workflow-refs/-policy`, `check-mirror-drift`,
   `check-duplicate-decls`. 11 of these are run from this repo's `package.json`,
   so this is the **most verifiable node on the whole epic** and the right one to
   build first on evidence, whatever the process order says.
2. **BPMN rendering / authoring** — `bpmn-render`, `render-bpmn`,
   `translate-bpmn`, satisfying `bpmn-authoring`, which IS tier A and uncovered.

These should be two nodes, not one. Rendering a diagram and auditing the graph
are different jobs with different inputs.

## Done when — REPLACES the list above

- [ ] a Tool node for the audit family; `satisfies` names the review skills, NOT
      `kg-export`
- [ ] a second node for BPMN rendering; `satisfies` names `bpmn-authoring`
- [ ] neither claims `kg-export`, which has five nodes already
- [ ] `tool-coverage` reachable through a Tool — the instrument that found this
- [ ] `ce65` cross-referenced both ways
