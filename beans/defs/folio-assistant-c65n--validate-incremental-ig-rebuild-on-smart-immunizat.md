---
# folio-assistant-c65n
title: 'VALIDATE incremental IG rebuild on smart-immunizations: BCG schedule test change — AST rebuild, cone, just-the-docs incremental re-render, before/after screenshots'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T06:29:03Z
updated_at: 2026-10-06T06:35:41Z
parent: folio-assistant-uhkv
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

## Fix for finding 2 (owner: "Fix it with a test and add it to the same PR")

`fsh-cone.ts` now blanks a declaration's `Title:` / `Description:` value (single-line or `"""` multi-line) before scanning for edges. On smart-immunizations: 3329 → 3203 edges, **126 removed, 0 added**, every one `<Table>VS -> <Table>` (a value set pointing at the decision table its Description names). The BCG schedule's forward cone is now the PlanDefinition alone (was 2), and the checkout is 16 files (was 19). The test in `fsh-cone.test.ts` fails without the fix and passes with it.

Not changed, on purpose: prose inside `insert` arguments and `* ^description = …` rules is still scanned, because an argument may be substituted into a canonical-valued rule.

## Round 2 (2026-10-06): an FSH source change carried through to a rendered page

Owner: "do a test that involves fsh source change". Same FSH-only commit (`a4b4cc4`, IMMZD18SBCG trigger text) against `37f6f24`.

**How it was compiled without packages.fhir.org.** The fork's `seed-fhir-cache-from-npm.py` installed 4 of 13 packages from trust anchors (hl7.fhir.r4.core 4.0.1 from npm `@hl7`, smart.who.int.base 0.2.0, hl7.fhir.uv.cpg 2.0.0, hl7.fhir.us.cqfmeasures 5.0.0). The other 9 (cql, crmi, sdc, extensions, terminology) are on no reachable source. SUSHI 3.20.1 compiled 721 resources with 15 errors, all from those missing packages (5 load failures, 10 SDC Questionnaires); IMMZD18SBCG had none. **No IG Publisher run**, so this is a SUSHI-only stand-in for the Publisher AST: a local shim wrote `output-ast/` in the `ig-ast/v1` layout, labelled `"ig-publisher": null`, with fsh-cone edges as `dependencies.json` (origin says so). The real pipeline then ran on it: `ig-ast.ts validity` / `diff`, `ast-to-artifact-index.ts`, `gen-ig-pages.ts --compiled-data`, jekyll.

| step | time |
|---|---|
| SUSHI, whole IG (not incremental) | 161 s before, 170 s after; includes timed-out registry attempts |
| shim → AST | 1.0 s |
| `ig-ast.ts diff` | 0.23 s: **1 changed, 721 unchanged**, matching the fixed cone (PlanDefinition only) |
| artefact index + 730 pages | 1.0 s |
| jekyll, all 2324 files (IG pages + AST pages + resource JSON) | 12.0 s; no-op incremental 3.0 s |
| **jekyll incremental, timing independent of restamping (owner)**: only the changed resource JSON | **2.8 s** (+1.4 s for a checksum copy over 2324 files) |
| jekyll incremental as the pipeline is today | 7.0 s, because 723 pages are rewritten |

The rendered page loads the compiled resource in the browser (`ast-resource.js`), so the FSH change shows on `ast/artifact/PlanDefinition-IMMZD18SBCG.html` after re-rendering and nowhere else. Screenshots were checked in Chromium: loaded state, no page errors.

## Findings, round 2

6. **`ast-to-artifact-index.ts` crashed on any resource whose `name` is not a string**: a Patient's `name` is HumanName[]. Fixed in this PR, with a test that fails without the fix.
7. **Restamping (design question, not fixed):** every artefact page prints the source commit ("compiled copy of `<sha>`"), so any commit rewrites all 722 artefact pages even when one resource changed. Jekyll incremental then does 7.0 s of work instead of 2.8 s. Moving the stamp into one shared data file (or stamping each page with its resource's own `builtAt`) would make the re-render proportional to the cone. Owner to decide.
8. The old cone's false edge was confirmed by compiling: the ValueSet it listed as a dependent did not change.
