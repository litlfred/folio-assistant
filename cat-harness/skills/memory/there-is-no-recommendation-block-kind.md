---
$schema: folio-memory/v1
id: there-is-no-recommendation-block-kind
label: stable
summary: "there is no `recommendation` block kind"
createdAt: 2026-09-19
roles:
  - code-reviewer
agents:
  - platform-boundary-guard
---
A normative statement is a labelled, titled `prose` block; the convention and
its limits are in `skills/folio-document-adapter/normative-statements.md`. A
real kind means a builder, a Zod schema, a label prefix, viewer registration,
constraint rows and QA criteria — about **thirty files** — and is tracked
separately rather than half-done.

Known-wrong and predating the document profile: `document-intake.md` maps
guideline recommendations onto `definition`, which is wrong for a document
folio, where `definition`'s `lean` field is required.
