---
# note on folio-assistant-tsh9 from claude/repin-3001-triage
$schema: folio-bean-note/v1
bean: folio-assistant-tsh9
branch: "claude/repin-3001-triage"
created: "2026-11-07"
---
## Train #3001's nine new failures, triaged (2026-11-07, ~06:00Z)

Reproduced on a fresh worktree mounted from the lock. The merge steward is driving #2985 (cat-harness b606cb7, tools 9a4ccd9, core 49496b4); no separate re-pin from this session.

- render:bpmn:check (3 core SVGs): fixed by core#661 (in core 49496b4); passes locally at those pins.
- declared-paths, bpmn-pot-current, tools.test pairs: fixed upstream by tools#1587 (f5d25878, f24a5721) and cat-harness#1104.
- audit:coverage:require-all / :strict: new `cache` kind (cat-harness-tools/caches) typed only. Handled by the steward's caches:viz:check line on #2985.
- "Repository gates (hard)": runs nothing itself. Red only because gates-docs was red on audit:coverage.
- gates-workflows "no check script is unrun": smart-base:processes:render:check. The steward holds this.
- stage: check:escaped-markup on reference/skill-instructions/journey-maps.html. A soft-wrapped line in cat-harness skills/ui/ui-core/journey-maps.md began with `<owner> sees")`, and kramdown read it as the start of an HTML block, so the rest of the page came out raw. Fix: cat-harness#1111.
