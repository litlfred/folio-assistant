---
# folio-assistant-pzwb
$schema: bean/1.0.0
title: 'Placement PR2: finish splitting folio-core and regroup the harness skill topics'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-29T08:05:00Z
parent: folio-assistant-9umr
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR2: finish splitting `folio-core` and regroup the harness skill topics. **Partly landed** (bean `9umr`, 2026-10-01): #1729 moved the 46 SDLC skills into `skills/sdlc/sdlc-core`, crdm and spec-kit into `skills/sdlc/`; #1734 moved `upload-routes`. Measured on main `b0ca040` 2026-10-01: `cat-harness/skills/folio-core/` still holds the 5 tool-surface skills (`mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `covered-is-not-reachable`); editorial skills that belong to core (`folio-editorial` 14, `one-voice` 3) and sci (`paper-editorial` 6) are still in `skills/authoring/authoring-core/`.

Remaining: tool-surface skills → a `tools` topic; core/sci editorial skills up; `process/workflow/{branch-freshness,code-review-process,release-lifecycle,release-epic-planning}` → `sdlc/sdlc-core`; `content-lifecycle` per ruling 1 (A — harness, generalised; 7 definitions back down from core; FHIR/Lean/qou bullets to owner refinements); `conduct-core/{getting-started,repo-conversion}` → core `conduct/onboarding/`; `ui-core/{board-windows,board-diagram-interchange}` → core `ui/boards/`; new core skill `block-change-summary`.

Waits on PR1 (`ybwt`, not yet on main — link when it lands).

## Done when
- [x] no `cat-harness/skills/folio-core/` directory remains (cat-harness#518, merged a334cf9, 2026-10-24: moved to `skills/tools/folio-core/` under a new `tools` topic)
- [ ] every topic in `skills/skills.json` holds at least one package; the harness holds no skill placed above it by proposal §1.2
- [ ] `knownSkills(checkout)` equals PR1's set plus `block-change-summary`
- [ ] `skill:register:check`, `kg:audit:check`, `check:agents-xref`, `bun run cat gates` green

## State 2026-10-09 — still open after the cutover
measured in the composed index checkout (folio-assistant 28283d2b9f; cat-harness mounted at bd72c68, cat-harness-tools at 3ce5100): `cat-harness/skills/folio-core/` still exists, holding `covered-is-not-reachable`, `mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `tool-authoring` (+ package-manifest). Box 1 not met; the rest not re-measured. This is now a PR to litlfred/cat-harness (and to core/sci for the editorial skills that move up). Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured by file name: 14 of 28 rows are in their target, 14 still in cat-harness.

_2026-10-24T08:16:00Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx (bean drain, stalled-triage thread).

_2026-10-29T08:05Z_ — Lane A (session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo; the 10-24 stalled-triage claim had lapsed) merged two PRs. litlfred/cat-harness#659 moved `process/workflow/{branch-freshness,code-review-process,release-epic-planning,release-lifecycle}` to `sdlc/sdlc-core`. litlfred/cat-harness#661 moved `deployment-auth` to `skills/tools/folio-core/`. The audit's crdm and spec-kit rows are out of date: #1729 placed them under `skills/sdlc/`. Still open, and each needs a split, not a move: `conduct-core/{getting-started,repo-conversion}` and `ui-core/{board-windows,board-diagram-interchange}`, which harness code names (site-chrome js/css, `schemas/semantic-zoom.ts`, `scenarios/roles.json`, `cat-harness.json`), so moving them to core adds wrong-direction edges. The core/sci editorial skills: the audit marks most of them SPLIT, with only a passage moving up. `evidence-appraisal` stays under ruling 1 (content-lifecycle stays in the harness). New core skill `block-change-summary` isn't written yet.
