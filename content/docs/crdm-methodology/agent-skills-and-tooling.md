The CRDM workflow is supported by skills and tools that the agent uses at each
phase. Some exist today; others are proposed.

### Existing capabilities

| Capability | Used in phase | How |
|---|---|---|
| **GitHub issue management** (`gh` CLI) | All phases | Issues are the primary artefact for requirements, impact analysis, and sign-off |
| **BPMN workflow authoring** (skill: `bpmn-authoring`) | Phase 2 | Agent can create and modify BPMN 2.0 process diagrams |
| **Content graph** (`content-graph.ts`) | Phase 4 | Dependency analysis across blocks and chapters |
| **QA criteria registry** (`qa-criteria-registry.ts`) | Phase 3, 4 | Register and scope new QA checks |
| **Beans** (`beans` CLI) | Phase 5, 6 | Work-plan creation and tracking |
| **Content validation** (`content_validate` MCP tool) | Phase 6 | Verify changes against schema and constraints |
| **Schema types** (`schemas/*.ts`) | Phase 3 | Define new types, constraints, and builders |
| **Document ingestion** (`uploads/` → `library/` pipeline) | Phase 2 | Ingest source documents for review |

### Proposed skills

| Skill | Phase | Purpose |
|---|---|---|
| **`crdm-detect`** | Trigger | Recognise when a request is a feature rather than content |
| **`crdm-needs-assessment`** | Phase 1 | Guide the user through needs articulation; identify stakeholders |
| **`crdm-impact-analysis`** | Phase 4 | Automated scan of affected schemas, pipeline scripts, adapters, and folios |
| **`crdm-requirements-template`** | Phase 3 | Generate structured requirements from conversation |
| **`review-triage`** | Phase 6 | Triage review comments from ingested documents (e.g. public consultation feedback) |

### Proposed tooling

| Tool | Purpose |
|---|---|
| **`crdm_start` MCP tool** | Enter CRDM mode for a given issue; scaffold the phases in the issue body |
| **`crdm_status` MCP tool** | Report which phase the current CRDM cycle is in and what deliverables are pending |
| **`stakeholder_map` MCP tool** | Given a proposed change, identify affected roles from `folio.config.json` and CODEOWNERS |
