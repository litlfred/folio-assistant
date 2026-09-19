---
$schema: folio-memory/v1
id: adapter-vs-profile
label: stable
summary: "adapter vs profile: a different axis, and conflating them is costly"
createdAt: 2026-09-19
roles:
  - code-reviewer
agents:
  - platform-boundary-guard
---
- **Adapters** (`paper`, `dak`) partition block kinds into **disjoint**
  namespaces. `adapterForKind` is what QA-criterion scoping reads, and it
  must stay **total and unambiguous**.
- **Profiles** (`document`, `paper`) **nest**: every document kind is also a
  paper kind.

Making `document` a third adapter would have made `adapterForKind` ambiguous
on all **eight** shared kinds. When adding a content type, ask whether it
needs different **code** (adapter) or only different **rules** (profile plus
a subclass).

`PaperContentAdapter` extends `DocumentContentAdapter`; `MATH_BLOCK_KINDS` is
written out in `schemas/block-kinds.ts` and `DOCUMENT_BLOCK_KINDS` is its
**derived** complement, so a kind added to `BLOCK_KINDS` cannot go
unclassified. Keep that derivation — do not hand-maintain both lists.
