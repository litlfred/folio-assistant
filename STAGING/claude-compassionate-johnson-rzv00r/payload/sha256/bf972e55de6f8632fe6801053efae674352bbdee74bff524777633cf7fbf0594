---
# folio-assistant-pzwb
title: 'Placement PR2: finish splitting folio-core and regroup the harness skill topics'
status: todo
type: task
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-01T06:58:00Z
parent: folio-assistant-iirv
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR2: finish splitting `folio-core` and regroup the harness skill topics. **Partly landed** (bean `9umr`, 2026-10-01): #1729 moved the 46 SDLC skills into `skills/sdlc/sdlc-core`, crdm and spec-kit into `skills/sdlc/`; #1734 moved `upload-routes`. Measured on main `b0ca040` 2026-10-01: `cat-harness/skills/folio-core/` still holds the 5 tool-surface skills (`mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `covered-is-not-reachable`); editorial skills that belong to core (`folio-editorial` 14, `one-voice` 3) and sci (`paper-editorial` 6) are still in `skills/authoring/authoring-core/`.

Remaining: tool-surface skills → a `tools` topic; core/sci editorial skills up; `process/workflow/{branch-freshness,code-review-process,release-lifecycle,release-epic-planning}` → `sdlc/sdlc-core`; `content-lifecycle` per ruling 1 (A — harness, generalised; 7 definitions back down from core; FHIR/Lean/qou bullets to owner refinements); `conduct-core/{getting-started,repo-conversion}` → core `conduct/onboarding/`; `ui-core/{board-windows,board-diagram-interchange}` → core `ui/boards/`; new core skill `block-change-summary`.

Waits on PR1 (`ybwt`, not yet on main — link when it lands).

## Done when
- [ ] no `cat-harness/skills/folio-core/` directory remains
- [ ] every topic in `skills/skills.json` holds at least one package; the harness holds no skill placed above it by proposal §1.2
- [ ] `knownSkills(checkout)` equals PR1's set plus `block-change-summary`
- [ ] `skill:register:check`, `kg:audit:check`, `check:agents-xref`, `bun run gates` green
