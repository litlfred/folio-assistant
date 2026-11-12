---
# folio-assistant-42gm
$schema: bean/1.0.0
title: 'Memory: CI-only "stale SVG" in BPMN render checks is caused by font hinting (sandbox unhinted, CI hints); fix is bootstrap-tools#66'
status: completed
type: task
priority: low
created_at: 2026-11-01T20:49:17Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-render-hinting.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: CI-only "stale SVG" in BPMN render checks is caused by font hinting (sandbox unhinted, CI hints); fix is bootstrap-tools#66

2026-11-01 (thread "Drain small repos and fa close-outs"): smart-base#272 and the 104 stale drawings behind bootstrap-tools#65 (Arimo revert, Q-FMR-1) are explained by fontconfig hinting. Claude sandboxes are unhinted (12-unhinted-grayscale.conf); Ubuntu CI runners hint. Locally forcing hintfull makes all 7 smart-base drawings stale even with Arimo, hintslight makes 1 stale.

Fix: draft bootstrap-tools#66 (branch claude/render-unhinted): Chromium gets FONTCONFIG_FILE=scripts/render-fonts.conf (machine fonts, always unhinted), keeps Arimo. 0 stale under every hinting setting locally. Needs an fa CI run pinned to it before merging; asked the "Fix red checks on fa main" thread. Leftover: glyphs outside Arimo latin subset (e.g. → in smart-base dak-l3-ig) still fall back to machine fonts.

**How to apply:** for any "stale only on CI" drawing, check hinting first. Reproduce with a FONTCONFIG_FILE that sets hinting true. See folio-assistant-co5e.
