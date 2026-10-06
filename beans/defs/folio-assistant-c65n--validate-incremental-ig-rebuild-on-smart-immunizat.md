---
# folio-assistant-c65n
title: 'VALIDATE incremental IG rebuild on smart-immunizations: BCG schedule test change — AST rebuild, cone, just-the-docs incremental re-render, before/after screenshots'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T06:29:03Z
updated_at: 2026-10-06T06:29:22Z
---

Owner request 2026-10-06: on a feature branch of litlfred/smart-immunizations, change one BCG schedule (IMMZD18SBCG) as a test and measure (1) AST rebuild time, (2) dependency-cone calculation time, (3) just-the-docs iterative re-render time, then show before/after screenshots of impacted content pages (index pages excluded).

## Todo
- [x] baseline just-the-docs site of smart-immunizations (before)
- [x] test change to IMMZD18SBCG on a local feature branch
- [x] time the dependency cone (fsh-cone.ts --changed)
- [ ] time AST rebuild — BLOCKED here: packages.fhir.org / tx.fhir.org denied by env network policy; no AST cache branch on litlfred/smart-immunizations
- [x] time jekyll incremental re-render
- [x] before/after screenshots of impacted content pages
- [ ] report to owner

## Measured 2026-10-06 (container, one run each unless noted)

Local feature branch `claude/test-bcg-schedule-c65n` of litlfred/smart-immunizations @ 37f6f24, NOT pushed: SUSHI cannot run here (packages.fhir.org denied), and the owner's rule for FHIR repos is that sushi passes before a commit is published.

| step | time |
|---|---|
| AST rebuild (IG Publisher + ast-export) | NOT RUN: packages.fhir.org and tx.fhir.org denied by the env network policy; no `cat/fhir-harness/fhir-ast/*` cache branch exists on litlfred/smart-immunizations |
| dependency cone `fsh-cone.ts --changed input/fsh/plandefinitions/IMMZD18SBCG.fsh` | 0.25–0.28 s (3 runs). Forward cone 2 nodes, backward checkout 19 files |
| stage-ig-sites `--only smart-immunizations` | 3.8 s cold, 1.5–1.8 s warm |
| jekyll full build (39 pages + 748 artefact pages) | 5.8 s |
| jekyll `--incremental`, no source change | 1.35 s |
| jekyll `--incremental`, checksum-only copy of the restaged source (2 files changed) | 1.41 s |
| jekyll `--incremental`, restage rewrites every file (all mtimes new) | 5.8 s, i.e. no gain over full |

## Findings

1. **The FSH change reaches no rendered page.** The staged Jekyll source is byte-identical before and after; `artifact/PlanDefinition-IMMZD18SBCG.html` is drawn from the PUBLISHED v0.2.0 index (`smart-immunizations/fhir-artifact-index`), not from source. Without an AST the render pipeline is blind to source FHIR edits.
2. **fsh-cone false edge from prose.** The forward cone lists `ValueSet IMMZD18SBCGVS` as a dependent of the PlanDefinition. The only link is the ValueSet's Description text "ValueSet IMMZD18SBCG for …", matched by the case-insensitive `\bvalueset\s+NAME` pattern (`cat-harness/content/pipeline/fsh-cone.ts` ~line 409): Title/Description string bodies are scanned as rules. Over-approximation (safe for rebuild, wrong as a graph).
3. **Incremental re-render only pays when unchanged files keep their mtime.** Jekyll incremental is mtime- and absolute-path-keyed; `stage-ig-sites` rewrites every file, so wiring incremental mode in needs a checksum-preserving copy into a stable source dir.
4. Control (page-content) edit to the BCG row in `decision-logic.md`: impacted rendered output = `decision-logic.html` + `assets/js/search-data.json` (index). No other page includes it, so incremental missed nothing.
5. Cosmetic: artefact-page footer "Package ⬜ based on FHIR 4.0.1" — the package name renders as a blank white pill in the local gem build.
