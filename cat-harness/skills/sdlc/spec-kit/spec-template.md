---
name: spec-template
title: Specification Template (github/spec-kit)
description: >
  The single declared template artefact for platform feature specifications,
  adopted from github/spec-kit. Mandatory sections and required fields are
  machine-readable here for automated validation.
mandatory_sections:
  - "User Scenarios & Testing"
  - "Requirements"
  - "Success Criteria"
recommended_sections:
  - "Edge Cases"
  - "Assumptions"
metadata_fields:
  - "Feature Branch"
  - "Created"
  - "Status"
---

# Feature Specification: [Feature Name]

**Feature Branch**: `claude/[branch-name]`
**Created**: YYYY-MM-DD
**Status**: Draft | Adjudicated
**Issue**: #[IssueNumber]
**Bean**: `folio-assistant-[bean-id]`
**Template**: `cat-harness/skills/sdlc/spec-kit/spec-template.md` (github/spec-kit)

## Context & Request

[Brief explanation of the originating request, verbatim or cited, with requester and date.]

---

## User Scenarios & Testing *(mandatory)*

### P1 — [Primary user journey / load-bearing capability]

**Journey.** [Step-by-step description of the journey from trigger to outcome.]

**Why this priority.** [Why this ranks as P1 — what breaks or fails if absent.]

**Independent test.** [Concrete test approach verifying this scenario standalone.]

**Acceptance scenarios.**

1. **Given** [precondition], **When** [trigger action], **Then** [expected observable outcome].
2. **Given** [precondition], **When** [error / alternative trigger], **Then** [expected outcome].

### P2 — [Secondary independent journey]

**Journey.** [Description.]

**Why this priority.** [Rationale.]

**Independent test.** [Verification approach.]

**Acceptance scenarios.**

1. **Given** [...], **When** [...], **Then** [...].

---

## Edge Cases

- **[Edge case 1 name]**: [Description, boundary condition, and handling.]
- **[Edge case 2 name]**: [Description, failure condition, and fallback.]

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST ...
- **FR-002**: The system MUST ...
- **FR-003**: The system MUST NOT ...

### Key Entities

- **[Entity 1]** — [Definition, lifecycle, invariants.]
- **[Entity 2]** — [Definition, relationship to governing artifacts.]

---

## Success Criteria *(mandatory)*

- **SC-001**: [Measurable, technology-agnostic outcome.]
- **SC-002**: [Measurable, technology-agnostic outcome.]
- **SC-003**: [Measurable, technology-agnostic outcome.]

---

## Assumptions

1. [Assumption 1 taken where the request was silent.]
2. [Assumption 2 taken where the request was silent.]

---

## Marker Conventions

- `[NEEDS CLARIFICATION: description]` — flags an unresolved ambiguity or design choice that requires human adjudication. **SHALL NOT** be resolved by agent judgement (`req:agent-workflow` → `judgement-stays-human`). A spec carrying an open clarification marker cannot reach Adjudicated status (SC-004).
- `ACTION REQUIRED` — marks a section requiring human input or sign-off before implementation begins.

## Lifecycle & Durable Trace (FR-013)

- **Drafting & Review**: Specs live strictly as comments on their governing GitHub issue. They are NOT committed as churn into the knowledge graph (`where-a-proposal-goes`).
- **Graduation**: Upon completion of the feature, accepted requirements graduate directly into governing skills (as `req:*` statements in `skills/requirements/` or relevant skill files) and automated tests. This preserves durable traceability without polluting the knowledge graph with transient SDLC discussions.
