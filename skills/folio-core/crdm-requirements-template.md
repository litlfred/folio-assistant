---
name: crdm-requirements-template
roles: [reader, collaborator, owner]
description: >
  Guide and template for CRDM Phase 3 — Requirements Definition.
  Helps the agent extract, structure, and group testable functional requirements
  from conversations with the Business Analyst (BA), establish end-to-end
  traceability from needs to beans, and format them for GitHub issue posting.
---

# CRDM Requirements Definition and Template

> Skill id: `crdm-requirements-template` · Roles: `[reader, collaborator, owner]` · Phase: `Phase 3`

This skill guides the agent through **CRDM Phase 3 — Requirements Definition**.
Once a needs statement (Phase 1) and workflow gap analysis (Phase 2) are established
under [`crdm-requirements-workflow.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-workflow.md),
the agent collaborates with the Business Analyst (BA) to translate high-level pain points
and user goals into clear, testable, and prioritized functional requirements.

The output is formatted as an interactive checklist posted directly to the associated GitHub issue,
establishing a bidirectional audit trail from user needs down to beans and feature pull requests.

---

## 1. When to Use This Skill

Activate this skill when:
- **Entering CRDM Phase 3**: Phase 1 needs assessment and Phase 2 business process analysis are documented on the issue.
- **Extracting requirements from conversation**: The BA is describing desired capabilities, workflows, or pain points in chat or on the issue.
- **Structuring informal requests**: Transforming unstructured prose, email threads, or consultation feedback into formal engineering specifications.
- **Scoping before Phase 4 & Phase 5**: Establishing the exact requirement list that will feed into [`crdm-impact-analysis.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-impact-analysis.md) and [`todo-manager.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/todo-manager.md).

---

## 2. Requirement Anatomy and Specification Schema

Every requirement produced in Phase 3 MUST contain the following eight attributes:

| Field | Description | Example |
|---|---|---|
| **ID** | Stable unique identifier formatted as `REQ-###` | `REQ-001` |
| **Title** | Concise, action-oriented name of the capability | Word Document Heading Extraction |
| **Description** | Plain-language explanation using RFC 2119 keywords (`SHALL`, `SHOULD`, `MAY`) | The ingestion engine SHALL parse `.docx` files in `uploads/` and convert heading levels 1–4 into equivalent Markdown headings. |
| **Acceptance Criteria** | Testable, unambiguous pass/fail conditions (Given/When/Then or verification checklist) | • Running ingestion on sample `.docx` yields `#`, `##`, `###` headings in `library/`<br>• Untracked heading levels fall back to `####`<br>• Exit code 0 on valid document |
| **Priority** | MoSCoW classification: `Must-have`, `Should-have`, or `Nice-to-have` | `Must-have` (MVP blocker) |
| **Source** | Traceability back to Phase 1 need, discussion turn, or stakeholder request | Phase 1 Needs Statement §3 (Public Consultation Feedback); Issue #203 comment #14 |
| **Impact** | Architectural footprint identified in Phase 4 | `content/pipeline/pot-extract.ts`, `schemas/types.ts` |
| **Estimated Scope** | PR-sized units of work expressed in bean count | 1 bean (~1 PR, ~120 lines) |

### RFC 2119 Keyword Conventions

- **`SHALL` / `MUST`**: Absolute requirement. The feature cannot ship without satisfying this condition.
- **`SHOULD` / `RECOMMENDED`**: Expected capability. Deviations or deferrals require explicit agreement from the BA.
- **`MAY` / `OPTIONAL`**: Non-essential enhancement or polish. Can be postponed to post-MVP iterations without penalty.

---

## 3. Generating Requirements from Conversation (BA Dialogue)

During conversation, the BA describes domain workflows, operational constraints, and human frustrations.
The agent extracts formal requirements through a four-step conversational technique:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Listen &     │       │ 2. Disentangle  │       │ 3. Formulate    │       │ 4. Validate &   │
│ Deconstruct     ├──────▶│ 'What' vs 'How' ├──────▶│ Testable        ├──────▶│ Confirm with BA │
│ (Symptom/Need)  │       │ (Function/Tech) │       │ Criteria        │       │ (Iterate)       │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Step 1: Listen and Deconstruct

Parse the BA's input for the underlying capability:

- **BA Statement**: *"Whenever reviewers upload Word documents with tables, the current ingestion completely jumbles the columns and we have to hand-format 80 pages."*
- **Underlying Need**: Lossless tabular data conversion from `.docx` to structured Markdown.

### Step 2: Disentangle "What" from "How"

Keep the functional specification independent of the technical implementation:

- **The "What" (Functional Requirement)**: The platform must detect tables in `.docx` uploads and output clean GitHub-Flavored Markdown (GFM) tables preserving rows and headers.
- **The "How" (Technical Proposal Note)**: Integrate `mammoth` or `pandoc` table filter in `content/pipeline/ingest-docx.ts` and add unit tests under `scripts/tests/docx-tables.test.ts`.

### Step 3: Formulate Testable Acceptance Criteria

Convert qualitative adjectives ("clean", "easy", "fast", "proper") into deterministic criteria:

- *Vague*: "Tables should look nice and not break."
- *Testable*:
  1. GFM tables contain header separator row `|---|---|`.
  2. Empty cells are preserved as empty table cells `| |`.
  3. Cell contents with newlines are flattened or converted to `<br>`.
  4. Script exits with code 0 on documents containing complex merged cells (with warning logged).

### Step 4: Validate and Confirm with the BA

Present the drafted requirement back to the BA in chat before committing it to the issue:

> "Here is what I have captured for table ingestion:
> **REQ-002: Word Document Table Conversion** (Must-have).
> It converts Word tables to GFM tables preserving headers and column alignment.
> Does this match what your reviewers need for the consultation tables?"

---

## 4. Grouping Requirements

To ensure clarity for both stakeholders and implementers, group requirements into logical clusters.

### Primary Scheme: By Workflow Area

1. **Ingestion & Import** — Sourcing documents, parsing Word/PDF, assets, bibliography ingestion.
2. **Authoring & Manifests** — Block kinds, builders, manifest syntax, chapter configurations.
3. **Validation & Quality Control** — Schema checking, constraints, QA criteria, profile checks.
4. **Rendering & Export** — Markdown assembly, LaTeX generation, HTML/PDF rendering, Pandoc pipelines.
5. **Review & Collaboration** — Staging previews, before/after comparisons, triage dashboards.
6. **Translation & Localization** — POT extraction, PO catalog injection, RTL validation.

### Secondary Scheme: By Architectural Layer

1. **Schemas & Constraints** ([`schemas/`](file:///Users/litlfred/space_cats/folio-assistant/schemas)) — Types, Zod definitions, constraints matrix.
2. **Pipeline Engines** ([`content/pipeline/`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline)) — Mechanical scripts, validators, serializers.
3. **Adapters & MCP Tools** ([`adapters/`](file:///Users/litlfred/space_cats/folio-assistant/adapters), [`src/tools/`](file:///Users/litlfred/space_cats/folio-assistant/src/tools)) — Content-type routing, tool registrations.
4. **Skills & Guidance** ([`skills/`](file:///Users/litlfred/space_cats/folio-assistant/skills)) — Agent instructions, automated subagents, onboarding docs.

---

## 5. Posting Requirements to the GitHub Issue

Format the requirements as an interactive checklist on the GitHub issue using this template:

```markdown
## CRDM Phase 3: Requirements Specification

**Parent Need**: [Link to Phase 1 Needs Statement on the issue]  
**Workflow Gap**: [Link to Phase 2 Process Analysis / BPMN]  
**Status**: Ready for BA & Stakeholder Review  

---

### Ingestion & Parsing

- [ ] **`REQ-001` — Docx Heading Hierarchy Extraction**
  - **Description**: The ingestion pipeline SHALL parse `.docx` files placed in `uploads/` and preserve heading hierarchy (levels 1 through 4) as Markdown headings.
  - **Priority**: Must-have (MVP)
  - **Source**: Phase 1 Needs Statement §2; User discussion 2026-09-24
  - **Acceptance Criteria**:
    - [ ] Level 1 headings map to `#`, Level 2 to `##`, Level 3 to `###`, Level 4 to `####`
    - [ ] Document title is extracted as frontmatter `title:`
    - [ ] Unstyled bold paragraphs are not falsely converted to headings
  - **Proposed Implementation**: New script `content/pipeline/ingest-docx.ts`
  - **Impact**: `content/pipeline/`, `skills/folio-core/document-ingestion.md`
  - **Scope**: 1 bean (1 PR)

- [ ] **`REQ-002` — Docx Table Conversion to GFM**
  - **Description**: The ingestion pipeline SHALL extract docx tables into valid GitHub-Flavored Markdown tables.
  - **Priority**: Must-have (MVP)
  - **Source**: Phase 1 Needs Statement §3 (Review feedback table triage)
  - **Acceptance Criteria**:
    - [ ] Generates valid markdown header rows `| Header | Header |`
    - [ ] Preserves empty cells without column collapse
    - [ ] Merged cells are normalized with an informational warning
  - **Proposed Implementation**: Integrated in `content/pipeline/ingest-docx.ts`
  - **Impact**: `content/pipeline/ingest-docx.ts`
  - **Scope**: 1 bean (1 PR)

---

### Review & Triage

- [ ] **`REQ-003` — Batch Comment Triage Dashboard**
  - **Description**: The platform SHOULD provide an MCP tool and dashboard to review extracted public consultation comments grouped by chapter section.
  - **Priority**: Should-have
  - **Source**: Stakeholder review committee notes
  - **Acceptance Criteria**:
    - [ ] MCP tool `comment_triage_list` returns structured comment array
    - [ ] Comments allow disposition: `accept`, `reject`, `defer`
  - **Proposed Implementation**: New MCP tool under `src/tools/comment-triage.ts`
  - **Impact**: `src/index.ts`, `schemas/assistant-types.ts`
  - **Scope**: 2 beans (2 PRs)

---

### Proposed Technical Deliverables Summary

| Category | Proposed Deliverable | Role |
|---|---|---|
| **Skills** | `skills/folio-core/docx-ingestion.md` | Guides agent through document intake |
| **Pipeline** | `content/pipeline/ingest-docx.ts` | Mechanical parser from docx to markdown |
| **Schemas** | `schemas/ingestion-types.ts` | Zod schema for parsed document AST |
| **MCP Tools** | `docx_ingest` registered in `src/index.ts` | Agent-accessible tool |
```

---

## 6. End-to-End Traceability (Needs ➔ Reqs ➔ Impact ➔ Beans ➔ PRs)

The agent maintains unbroken traceability across all CRDM phases:

```
Phase 1: Needs Statement ───────┐
                                ▼
Phase 2: Workflow Gap ──────────▶ Phase 3: Requirement (REQ-001)
                                         │
                                         ▼
Phase 4: Impact Analysis ────────▶ Affected Files & Migration
                                         │
                                         ▼
Phase 5: Sign-Off ──────────────▶ Bean Creation (fa-xxxx)
                                         │
                                         ▼
Phase 6: Iterative Dev ─────────▶ Feature Branch & PR (#YYY)
```

### Traceability Matrix Table

Include this matrix in the Phase 5 sign-off package to demonstrate complete coverage:

| Need ID / Source | Requirement ID | Phase 4 Impact | Implementation Bean | Delivery PR | Status |
|---|---|---|---|---|:---:|
| Need-1 (Docx Import) | `REQ-001` (Headings) | `content/pipeline/` | `fa-d1a2` | PR #240 | Open |
| Need-1 (Docx Import) | `REQ-002` (Tables) | `content/pipeline/` | `fa-d1a3` | PR #241 | Open |
| Need-2 (Review Triage)| `REQ-003` (Dashboard) | `src/tools/`, `schemas/` | `fa-d1a4` | PR #243 | Open |

### Traceability Rules

1. **No Orphan Requirements**: Every requirement must link directly to a Phase 1 need and Phase 2 workflow gap.
2. **No Speculative Beans**: An agent must NEVER create a bean that does not trace back to an approved requirement in Phase 3.
3. **No Unilateral Closure**: Requirements are checked off as PRs merge, but the parent issue is NEVER closed without explicit authorization from the BA or stakeholders.

---

## Cross-References

- [`crdm-requirements-workflow.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-workflow.md) — The parent six-phase CRDM process
- [`crdm-impact-analysis.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-impact-analysis.md) — Phase 4 impact analysis and migration planning
- [`crdm-detect.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-detect.md) — CRDM trigger and capability detection
- [`todo-manager.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/todo-manager.md) — Phase 5 bean creation and check-before-create protocol
- [`staging-review.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/staging-review.md) — Phase 6 before/after staging review
- [`crdm-methodology.md`](file:///Users/litlfred/space_cats/folio-assistant/docs/crdm-methodology.md) — Complete user-facing CRDM methodology guide
