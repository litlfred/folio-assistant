---
# folio-assistant-0r7u
title: 'CONTENT SPLIT 2026-10-06: authoring, review and publication to folio-assistant-core; methods stay in cat-harness — before seeding and before GOAL 5 resumes'
status: in-progress
type: task
priority: high
created_at: 2026-10-06T06:42:34Z
updated_at: 2026-10-06T07:07:13Z
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

## Holder 2026-10-06
Claimed by https://claude.ai/code/session_012qoycyCSGidZqW245vXhze on branch `claude/dazzling-wright-xshj1s` (PR #2254). Starting with step 0.

## Lanes, 2026-10-06 06:54Z (owner: "dispatch agents/two new sessions to help speed up / parallelize work if it will help")
Split by FILE AREA so the lanes don't collide:
- **G** (session_01PpkdTJt4sgLQ82hbnTb1sU): steps 1–3, skills and processes (`*/skills/**`, `*/processes/**`).
- **H** (session_012dn4UVLnHDxP1qR9xmotSw): step 4 and the doc candidates of step 3 (`cat-harness/docs/**`, `content/docs/**`).
- **Coordinator**: step 0 (hard-coded upward paths), step 5 (code), then S5 `txue`.
Generated files conflict across lanes by design; each lane merges main and runs `bun run regen`.

## Step 0 progress, 2026-10-06 07:25Z

**Done (declaration-driven, output verified):**
- `check-term-mapping` walks every instance's declared glossary. It now also reaches who-iris's `who-terms`, which the literal path silently skipped.
- `external-schemas` `skosTermsInUse` reads every declared `schemas` graph; output identical.
- The `glossary-build` Tool is declared by folio-assistant-core. Its cat-harness kg-qa sidecar was removed under the 5hox ruling (derived QA off main), and core's is gitignored as derived.

**Left as is, deliberately:** `kg-detangle` LITERAL_SCAN. It reports an absent directory honestly, and its header makes scan scope a person's decision. After the split this cross-instance measurement belongs to the parent checkout.

**Needs a design, not a path edit (two classes):**
1. **Repo-wide orchestration** in cat-harness(-tools): `gates.ts` (fhir-harness steps), `task-io.ts` and `regen-after-merge.ts` (smart-* task rows), `merge-train.ts` (the smart-base KG repair), `check-secret-leaks` ROOTS (who-iris).
   - Proposal: each instance declares its own tasks (IO class, repair hook, scan roots), and the orchestrator aggregates them via `instanceRootsIn`.
   - Whatever must name every layer belongs to the top-level folio-assistant instance, which may name any layer.
2. **Stale measured lists:** `qa-refresh` hardcodes `[cat-harness, smart-base, who-iris]` as the libraries that need an LSI index. Asked today, `lsi.needOf` also flags smart-trust and smart-immunizations, so the literal is out of date. Proposal: derive the writers from `proseGraphs()` + `needOf()` at run time (cost measured at about 2.9 s).
3. **Content-specific:** `translation-tools.ts` points at a core BPMN; `vocabulary` maintains `folio-assistant-core/ns.jsonld`; `schemas/jsonld.ts` holds core's (and sci's) vocabulary. These follow the contribution pattern: each harness contributes its own entries (as `riit` and `dmx1` did for kinds).
