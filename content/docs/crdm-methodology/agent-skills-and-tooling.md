The CRDM workflow is supported by skills and tools that the agent uses at each
phase. Some exist today; others are proposed.

### Existing capabilities

| Capability | Used in phase | How |
|---|---|---|
| **GitHub issue management** | All phases | Issues are the primary artefact for requirements, impact analysis, and sign-off. Agents reach GitHub through the MCP tools, not the `gh` CLI, which is not available in every harness |
| **BPMN workflow authoring** (skill: `bpmn-authoring`) | Phase 2 | Agent can create and modify BPMN 2.0 process diagrams |
| **Content graph** (`content-graph.ts`) | Phase 4 | Dependency analysis across blocks and chapters |
| **QA criteria registry** (`qa-criteria-registry.ts`) | Phase 3, 4 | Register and scope new QA checks |
| **Beans** (`beans` CLI) | Phase 5, 6 | Work-plan creation and tracking |
| **Content validation** (`content_validate` MCP tool) | Phase 6 | Verify changes against schema and constraints |
| **Schema types** (`schemas/*.ts`) | Phase 3 | Define new types, constraints, and builders |
| **Document ingestion** (`uploads/` → `library/` pipeline) | Phase 2 | Ingest source documents for review |

### Skills that now exist

| Skill | Phase | Purpose |
|---|---|---|
| **`crdm-detect`** | Trigger | Recognise when a request is a feature rather than content. Five categories of detection phrasing, an explicit "not a feature request" list, and the session-state rules |
| **`crdm-requirements-workflow`** | All phases | The six-phase process, the actors table, and the issue-association rules |

Both are guidance, not instrumentation: they tell an agent what to do, and
nothing checks that it did. See "What is not built yet" for why that
distinction is kept explicit.

### Proposed skills

| Skill | Phase | Purpose |
|---|---|---|
| **`crdm-needs-assessment`** | Phase 1 | Guide the user through needs articulation; identify stakeholders |
| **`crdm-impact-analysis`** | Phase 4 | Automated scan of affected schemas, pipeline scripts, adapters, and folios |
| **`crdm-requirements-template`** | Phase 3 | Generate structured requirements from conversation |
| **`review-triage`** | Phase 6 | Triage review comments from ingested documents (e.g. public consultation feedback) |

### Running the process — it is already executable

**`crdm_start` and `crdm_status` were proposed here and should not be built.**
The generic workflow tools already run this process, because
`docs/workflows/crdm-requirements.bpmn` is a loadable BPMN process like every
other diagram in this repository:

| Instead of | Use |
|---|---|
| `crdm_start` | `workflow_start` with `crdm-requirements` and the bean the work hangs on |
| `crdm_status` | `workflow_next` — what is enabled now, which lane owns it, which skill implements it |
| a phase checklist | `workflow_complete`, which **refuses a step that is not enabled**, so phases cannot be claimed out of order |

A second set of tools over the same diagram would be a second answer to
"where are we", free to disagree with the first. State lives under
`.folio/workflow/` and is committed, so a sibling session sees the same
position — which is the property a chat-local phase tracker could never have.

Every activity in the agent's lane carries the skill that implements it, so
`workflow_next` returns something actionable rather than a step name:

| Step | Skill |
|---|---|
| Detect feature request | `crdm-detect` |
| Scan / link / ask about the issue | `crdm-requirements-workflow` |
| Phase 1 — stakeholders, synthesise needs | `crdm-requirements-workflow` |
| Phase 2 — map the current workflow | `bpmn-authoring` |
| Phases 3–4 — requirements and impact | `crdm-requirements-workflow` + `content-graph` |
| Phase 5 — create beans | `todo-manager` |
| Phase 6 — implement | `prepare-merge` |
| Post the round summary | `delivery-summary` |
| Close the issue | `crdm-requirements-workflow` |

Three steps also carry a work-plan effect the engine performs: implementing
claims the bean, creating beans notes it, and closing resolves it — and
resolve only lands once the instance itself has completed, because whether
work is done is a judgement.

### Still proposed

| Tool | Purpose |
|---|---|
| **`stakeholder_map` MCP tool** | Given a proposed change, identify affected roles from `folio.config.json` and CODEOWNERS |
