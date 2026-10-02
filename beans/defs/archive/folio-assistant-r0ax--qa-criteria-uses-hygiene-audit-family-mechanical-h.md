---
# folio-assistant-r0ax
title: 'QA criteria: uses[] hygiene audit family (mechanical + human)'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:13:26Z
updated_at: 2026-08-07T09:28:10Z
---


## Ask

Audit flag on *proper use* of `uses[]`, surfaced as a QA sidecar criterion.
Both mechanical and human/agent checks. Must not pollute `uses[]` with Lean.

## Criteria

- `uses-editorial-hygiene` (automated: true, major) — mechanical:
  self-reference, unresolvable label, duplicate entry, transitive
  redundancy (A uses B, B uses C, A uses C), and label-kind sanity.
- `uses-editorial-completeness` (automated: false, major) — agent/human:
  does every block the narrative actually leans on appear in `uses[]`?
  Is each listed entry genuinely *expository* (a reader needs it) rather
  than a formal artifact someone copied in from Lean?
- `uses-formal-coverage` (automated: true, **minor / warn only**) — formal
  Lean edge with no editorial counterpart anywhere in the editorial cone.
  Advisory signal of a possible exposition gap. NEVER fails, NEVER
  auto-fixes. This is the criterion most at risk of being misread as
  "uses[] must mirror Lean" — the description must say outright that it
  does not.

Depends on 36f8 for the graph, 3cw6 for the semantics.

## Landed

All three criteria registered (`uses` domain + watcher axis), checkers in
`content/pipeline/qa-checkers-uses.ts`, adjudicator skill
`skills/folio-core/uses-editorial-review.md`.

Verified on litlfred/qou (2958 blocks): 2611 pass / 339 warn / 8 fail.
The 8 are genuine dangling labels (`def:hecke-algebra` cited 3x, no
defining block). Severity is graded — broken edges fail, transitive
redundancy warns — so ~340 lint findings don't bury 8 real breakages.
