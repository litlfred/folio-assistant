---
# folio-assistant-0r7u
title: 'CONTENT SPLIT 2026-10-06: authoring, review and publication to folio-assistant-core; methods stay in cat-harness — before seeding and before GOAL 5 resumes'
status: todo
type: task
priority: high
created_at: 2026-10-06T06:42:34Z
updated_at: 2026-10-06T06:42:34Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-06, verbatim: *"do content split propoerly across repos"*, *"that needs to be done before F"*, and *"not a race to separate.   do it properly."* Placement rule: *"folio-asst-core focused on content authroiung, review pubilcation.   cat-harness on SDLC, tooling, decision making, general methdologies, basic common infra/state mgmt"*.

Story `rfuq` (S4, direction and placement) owns this; it is parented to the arc because a task cannot parent a task.

Evidence and every candidate: `cat-harness/docs/proposals/separation-placement-review-2026-10-06.md`.

## Rulings that bound it (2026-10-06)
- **1A vs today's rule:** SPLIT. Method write-ups stay in cat-harness; operational authoring, review and publication skills, processes and code go to core.
- **Content-object model** (`types`, `builders`, `webpage`, `block-kinds`): **stays in cat-harness** as common infrastructure.

## Order: one concern group per PR, each green and merged before the next
- [ ] 0. cut the hard-coded upward paths (`check-term-mapping`, `external-schemas`, `kg-detangle`, the `glossary-build` Tool, `translation-tools`, `gates`/`task-io`/`regen-after-merge`, `merge-train`, `qa-refresh`, `check-secret-leaks`, the `jsonld` vocabulary)
- [ ] 1. the generic content group (`content-lifecycle`, voice-review, `technical-documentation`, `review-task`, `review-narrative`, `voice-review.bpmn`): split method from operation
- [ ] 2. PR2 (`pzwb`): the folio-core split and the editorial set, with the per-item list written into that bean first
- [ ] 3. new skill and doc candidates (`diff`, `folio-board-requirements`, `new-content-type`, the `publication-workflow` split, the `html-rendering-qc`/`docs-generation`/`glossary-build` splits; `staging-review` kept or split, never moved whole)
- [ ] 4. PR9 (`p9bu`): docs pages follow their subject; retarget `gen-processes-viz` for the 19 generated core/sci process pages
- [ ] 5. code: authoring, review and publication modules and Tool nodes to core (bibliography, library/L1, content pipeline, authoring scripts); maths/Lean/TeX to sci (ruled Q4); KG materialisation **down** to cat-harness-tools
- [ ] 6. upward mentions that are links or paths fixed; the `check:reference-direction` PENDING list kept current
- [ ] every PR leaves no staying file naming a moved one (a rewording pass), and `check:import-direction`, `check:partition` and `check:reference-direction` hold

## Not this bean
- S5 `txue` (all remaining cat-harness code to cat-harness-tools, including `y9r6`) follows this bean, so code moves once and to its final home.
- Seeding itself (S7 `mgxw`).
