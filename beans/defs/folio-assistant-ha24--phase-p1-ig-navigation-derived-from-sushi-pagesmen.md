---
# folio-assistant-ha24
title: 'PHASE P1: IG navigation derived from sushi pages:/menu:, diffed against the Publisher''s — per IG and combined'
status: todo
type: feature
created_at: 2026-10-01T12:32:20Z
updated_at: 2026-10-01T12:32:20Z
parent: folio-assistant-uhkv
blocked_by:
    - folio-assistant-qrnz
---

Phase P1 of `fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md` (approved 2026-09-30). Opened 2026-10-01 in the phased-transition review: closing `kn0t` had left the phase with no work-plan entry.

**Exit criterion (the skill's words):** the derived navigation is diffed against the Publisher's, **one diff per IG**; each difference is **empty or explained entry by entry**; the per-IG diffs are also reported **together**.

**State:** `bamf` already derives navigation from the menu (`build-ig-site.ts` `menuNav`). Nothing diffs it against the Publisher's yet.

**Blocked by `qrnz`** for the combined view, which needs a second IG; one IG is not "per IG and together". The smart-trust diff can be built and run before `qrnz` lands.

## Done when
- [ ] a nav-diff tool: `bamf`'s derived nav against the Publisher's `toc` and menu, read from a Publisher `gh-pages` tree
- [ ] smart-trust's diff: empty, or explained entry by entry
- [ ] the combined report across at least 2 IGs (after `qrnz`)
