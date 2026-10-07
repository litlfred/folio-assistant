---
# folio-assistant-g2sv
title: folio-assistant-sci.json declares no skills directory, so its ~70 paper-adapter skills are reachable only through known-skills.ts
status: completed
type: bug
priority: high
created_at: 2026-10-04T15:09:14Z
updated_at: 2026-10-04T15:30:37Z
parent: folio-assistant-9umr
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). folio-assistant-sci/skills/ holds the paper adapter, but folio-assistant-sci/folio-assistant-sci.json has no kg entry for it: present but undeclared, the inverse of dh4f.

## Done when
- [x] the directory is declared as a kg graph per directory-conventions
- [x] skill_list / LOCAL_PACKAGES serves it; the directory checks are green


## Summary of Changes
_2026-10-04T15:30:37Z_ — PR #2107. RE-MEASURED FIRST, and the premise was half wrong: `folio-assistant-sci/skills/` was already reachable, through the `skills` entry of DEFAULT_DIRECTORIES (ownDirectories seeds it for every instance, declaredBy '(default)'). `discoverLocalPackages` served the same 7 sci packages (folio-paper-adapter included) before and after. The qou analysis read only the declaration file. Declared explicitly anyway, with id `skills` so it OVERRIDES the default rather than adding a second entry at the same path (the rule sci's `library` entry states). check:declared-dirs and check:harness-dirs are green, and the package list is unchanged (31 from sci's root, 36 from the checkout root).
