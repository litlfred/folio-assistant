---
# folio-assistant-9x17
title: 'TOOL 10/13: Task_Validate — schema & constraint validation (12 files, 3 entry points)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:35:26Z
updated_at: 2026-09-20T04:35:26Z
parent: folio-assistant-d308
---

Group 10 of 13 in `d308`. **12 files, 3 entry points.**

`validate`, `validate-value`, `validate-references`,
`validate-references-human-review`, `validate-defterm`, `validate-bib`,
`profile-check`, `check-corpus-gate`, `check-schema-nodes`, `schema-nodes`,
`xml-comment-check`.

**BPMN:** `authoring-a-paper · Task_Validate` — shared with group 6 (`oait`).
Also `authoring-a-document · Task_Validate` and `Task_ProfileCheck`, and
`editing-hci-validation · Task_SchemaValidate · Task_SyntaxSpell`.

**Target repo (#223):** `folio-assist-core`. The 59 CARRY schema files are its
subject, not its siblings.

**What `profile-check` is for, so a Tool does not flatten it:** it catches what
schema validation STRUCTURALLY cannot — a block that is valid against its schema
but wrong for its content profile. Adapters partition disjointly; profiles nest.
A Tool that presented "validate" as one operation would lose the distinction the
second check exists for. See `content-profiles`.

## Done when
- [ ] a Tool node with schema validation and profile check as DISTINCT operations
- [ ] `satisfies` includes `content-validate`
- [ ] `alternativeTo` / `selection` set against group 6, since they share a task
- [ ] `tool-coverage` reflects it
