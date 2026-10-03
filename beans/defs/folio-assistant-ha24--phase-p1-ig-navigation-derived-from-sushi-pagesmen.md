---
# folio-assistant-ha24
title: 'PHASE P1: IG navigation derived from sushi pages:/menu:, diffed against the Publisher''s — per IG and combined'
status: todo
type: feature
priority: normal
created_at: 2026-10-01T12:32:20Z
updated_at: 2026-10-02T18:00:38Z
parent: folio-assistant-uhkv
---

Phase P1 of `fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md` (approved 2026-09-30). Opened 2026-10-01 in the phased-transition review: closing `kn0t` had left the phase with no work-plan entry.

**Exit criterion (the skill's words):** the derived navigation is diffed against the Publisher's, **one diff per IG**; each difference is **empty or explained entry by entry**; the per-IG diffs are also reported **together**.

**State:** `bamf` already derives navigation from the menu (`build-ig-site.ts` `menuNav`). Nothing diffs it against the Publisher's yet.

**Blocked by `qrnz`** for the combined view, which needs a second IG; one IG is not "per IG and together". The smart-trust diff can be built and run before `qrnz` lands.

## Done when
- [ ] a nav-diff tool: `bamf`'s derived nav against the Publisher's `toc` and menu, read from a Publisher `gh-pages` tree
- [ ] smart-trust's diff: empty, or explained entry by entry
- [ ] the combined report across at least 2 IGs (smart-trust and smart-immunizations, both ingested)

## Owner ruling 2026-10-01: every phase renders equivalent to the standard IG render

In the owner's words: *"each phase needs to render equivalent to existing IG standard render"*.

This is an invariant across **all** phases, not just P0's exit criterion. Whatever a phase changes in the pipeline, its output must stay equivalent to the IG Publisher's standard render of the same IG. The measured reference is `jut3`'s parity table: the Publisher's page set, by page kind.

**Open tension, put to the owner:** P2 as approved drops XML/Turtle ("recorded as a refusal"). Under this invariant, a refused representation is a difference from the standard render.

## Owner direction 2026-10-01 for P1

In the owner's words: *"see bean about QA that every harness viewer needs to have navbar menu item. use pages: menu: for IGs as data for this. reuse sushi-config etc"*.

- **Data:** the IG's `sushi-config.yaml` `pages:` and `menu:`, already read by `ingest-ig-menu.ts` (`menu.json`) and `build-ig-site.ts` (`pageNav`, `menuNav`). Reuse these; do not write a new parser.
- **The QA bean the owner means is not yet pinned down.** A search (2026-10-01) found no open bean stating "every viewer needs a navbar menu item". The closest:
  - `edx7` (completed): the navbar is a common fixture on every viewer page; the gate `viewer pages keep the navbar they had` enforces it.
  - `603s` (in progress): the LHS navbar has one themed section per instance.

  To confirm with the owner.



## 2026-10-02: unblocked
The second IG landed: `qrnz` is completed, and smart-immunizations is ingested at `smart-immunizations/fhir-artifact-index/`. The combined report is now ordinary work, no longer blocked, so the Done-when names the two IGs instead of the closed bean (`check:stale-paths`).
