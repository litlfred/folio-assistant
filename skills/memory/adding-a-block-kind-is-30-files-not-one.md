---
$schema: folio-memory/v1
id: adding-a-block-kind-is-30-files-not-one
label: trap
summary: "adding a block kind is ~30 files, not one"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
Builder, Zod schema, label prefix, viewer registration, constraint rows, QA
criteria. **There is no `recommendation` kind**: a normative statement is a
labelled, titled `prose` block
(`skills/folio-document-adapter/normative-statements.md`). Enumerate the cost
before starting rather than half-doing it.

Known-wrong and predating the document profile: `document-intake.md` maps
guideline recommendations onto `definition`, which is wrong for a document
folio, where `definition`'s `lean` field is **required**.
