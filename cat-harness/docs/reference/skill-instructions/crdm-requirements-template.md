---
layout: default
title: 'Phase 3'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/crdm/crdm-requirements-template.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/crdm/crdm-requirements-template.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/crdm/crdm-requirements-template.md){: .fa-edit-source }

{% raw %}
# Phase 3 — Requirements definition (detail)

This skill expands the Phase 3 summary in `crdm-requirements-workflow.md`.

## Requirement format

Each requirement has:

| Field | Format | Example |
|---|---|---|
| **ID** | `REQ-###` | `REQ-001` |
| **Title** | Short phrase | "Beans filtered by epic type" |
| **Description** | Plain language, no jargon | "The agent can filter work items by their type (epic, story, task)" |
| **Acceptance criteria** | Testable, measurable | "Given an epic with 3 child stories, when filtered by epic, then all 3 appear" |
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

- [ ] **REQ-001** — Beans filtered by epic type
  - _Acceptance:_ Given an epic, when `beans list --type epic`, then only epics appear
  - _Scope:_ 1 bean, 1 PR

- [ ] **REQ-002** — Release lifecycle skill
  - _Acceptance:_ Skill exists at `cat-harness/skills/workflow/release-lifecycle.md`
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
Bean (Phase 5)
    ↓ PR link
PR (Phase 6)
```

## Cross-references

- [`crdm-requirements-workflow`](crdm-requirements-workflow.md) — Phase 3
- [`crdm-impact-analysis`](crdm-impact-analysis.md) — Phase 4 follows this
- [`crdm-detect`](crdm-detect.md) — detection
- [`../../skills/folio-core/todo-manager.md`](todo-manager.md) — bean creation
{% endraw %}
