---
name: crdm-requirements-template
description: >
  Guide and template for CRDM Phase 3 — Requirements Definition.
  Helps the agent structure requirements from conversation using a
  REQ-### format with acceptance criteria, priority, and traceability.
---

# Phase 3 — Requirements definition (detail)

This skill expands the Phase 3 summary in `crdm-requirements-workflow.md`.

## Requirement format

**One definition, shared with spec-kit** (issue #2405 FR-008): a statement, a
conformance level, a source, **at least one success criterion with its
verification method**, and a sign-off owner —
the `requirement-definition` skill (`skill_fetch requirement-definition`)
in the content layer. The fields below are CRDM's rendering of it;
*Acceptance criteria* are the success criteria. A requirement with none is not
ready to post.

Each requirement has:

| Field | Format | Example |
|---|---|---|
| **ID** | `REQ-###` | `REQ-001` |
| **Title** | Short phrase | "Beans filtered by epic type" |
| **Description** | Plain language, no jargon | "The agent can filter work items by their type (epic, story, task)" |
| **Conformance** | SHALL / SHOULD / MAY / SHALL NOT | SHALL |
| **Acceptance criteria** (= success criteria, ≥ 1) | Testable, measurable, each with a key and a verification method (`test` / `inspection` / `review` / `analysis`) | "`SC-1` (test) — Given an epic with 3 child stories, when filtered by epic, then all 3 appear" |
| **Sign-off owner** | Who says it is met — a named person or role | "The BA" |
| **Priority** | Must-have / Should-have / Nice-to-have | Must-have |
| **Source** | Phase 1 needs statement ref | "Needs statement §2 — BA cannot see work grouped by release" |
| **Impact** | Phase 4 footprint | "Schema: new `type` field on bean. Pipeline: none" |
| **Estimated scope** | Bean count / PR sizing | "2 beans, 1 PR" |

### Conformance keywords

Use RFC 2119 in formal statements:
- `SHALL` — mandatory
- `SHOULD` — recommended
- `MAY` — optional
- `SHALL NOT` — prohibited

## Generating from conversation

### 4-step elicitation

1. **Listen and deconstruct** — identify the nouns (entities), verbs
   (capabilities), and adjectives (qualities) in the BA's description
2. **Disentangle what from how** — "I need to see beans grouped by release"
   is a requirement; "use a Jekyll page" is an implementation choice
3. **Formulate testable criteria** — every requirement must have a
   Given/When/Then or a checkable statement
4. **Validate with the BA** — read it back. "Does this capture what you
   need? Anything missing?"

## The document is a requirement set (issue #2405, FR-010)

The requirements document as a whole is a **`RequirementSet`**
(`bootstrap-tools/schemas/requirement-set.ts`, published as
`bootstrap/schemas/requirement-set.schema.json`): `reqset:<slug>`, the
methodology, the issue, a **stage** — `draft → proposed → approved → planned →
in-progress → delivered → accepted`, or `rejected`, `cancelled`, `superseded` —
its members (`req:` references, each with its own decision), its work plan
(bean ids) and its sign-offs. Commit it beside the proposal as
`<slug>.requirement-set.json`, or as a `requirementSet:` key in the proposal's
front matter; `check:requirements` judges it.

The set's stage and each member's `status` are **independent** — a requirement
outlives the document that proposed it — with one link enforced: a set is
`accepted` only when every member it approved is `in-force`. The stage moves
only through a sign-off (Phase 5's `BA_Signoff`, close-out's `BA_Confirm`),
and `check:requirements` refuses `approved`/`accepted` without a human
sign-off, `planned` without beans, and `cancelled` without a reason.

## Grouping requirements

### By workflow area

| Area | Examples |
|---|---|
| Ingestion | Document upload, structure extraction |
| Authoring | Block editing, chapter management |
| Validation | Schema checks, QA criteria |
| Rendering | PDF, HTML, Markdown output |
| Review | Staging, before/after comparison |
| Translation | PO extraction, machine + human translation |
| Release | Versioning, changelog, release gating |

### By architectural layer

| Layer | Examples |
|---|---|
| Schemas | Type definitions, constraints, builders |
| Pipeline | Validators, renderers, extractors |
| Adapters/Tools | Block-kind routing, MCP tools |
| Skills | Agent guidance, workflow definitions |

## Posting to the issue

Format as a markdown checklist:

```markdown
## Requirements — [Feature name]

### Must-have

- [ ] **REQ-001** (SHALL) — Beans filtered by epic type
  - _Source:_ needs statement §2
  - _Acceptance:_ `SC-1` (test) — Given an epic, when `beans list --type epic`, then only epics appear
  - _Sign-off owner:_ the BA
  - _Scope:_ 1 bean, 1 PR

- [ ] **REQ-002** (SHALL) — Release lifecycle skill
  - _Source:_ needs statement §3
  - _Acceptance:_ `SC-1` (inspection) — Skill exists at `cat-harness/skills/process/workflow/release-lifecycle.md`
  - _Sign-off owner:_ the BA
  - _Scope:_ 1 bean, 1 PR

### Should-have

- [ ] **REQ-003** — ...

### Deliverables summary

| ID | Title | Priority | Beans | Status |
|---|---|---|---|---|
| REQ-001 | Beans filtered by epic type | Must | 1 | ⬜ |
| REQ-002 | Release lifecycle skill | Must | 1 | ⬜ |
```

## Traceability

Every requirement traces in both directions:

```
Needs statement (Phase 1)
    ↓ "Source" field
Requirement (Phase 3)
    ↓ "Impact" field
Impact assessment (Phase 4)
    ↓ bean reference
Bean (Phase 5) — names its REQ / req: statements; `## Done when` copied from their acceptance criteria
    ↓ PR link
PR (Phase 6)
```

## Cross-references

- [`crdm-requirements-workflow`](crdm-requirements-workflow.md) — Phase 3
- [`crdm-impact-analysis`](crdm-impact-analysis.md) — Phase 4 follows this
- [`crdm-detect`](crdm-detect.md) — detection
- [`../../skills/sdlc/sdlc-core/todo-manager.md`](../sdlc-core/todo-manager.md) — bean creation
- [`../../skills/sdlc/sdlc-core/specification-management.md`](../sdlc-core/specification-management.md) — governance and EARS/ISO statement quality
- [`../../../methodologies/requirements-standards-assessment.md`](../../../methodologies/requirements-standards-assessment.md) — open standards (ReqIF, OSLC-RM, EARS, ISO 29148) assessment
