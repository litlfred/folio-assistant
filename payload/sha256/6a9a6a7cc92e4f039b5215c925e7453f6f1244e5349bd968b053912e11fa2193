---
# folio-assistant-4u5d
$schema: bean/1.0.0
title: 'IG artefact index built at publish by fhir-harness from the AST: no IG instance commits fhir-artifact-index/'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-23T14:30:00Z
updated_at: 2026-10-30T11:45:00Z
parent: folio-assistant-n3h9
---

## Parent

folio-assistant-n3h9

Related: folio-assistant-p7mb (build derived artefacts at publish).

Owner, 2026-10-23: "fhir-artifact-index/ → shouldn't that be a part of fhir-harness?" and "1 and implement" (plan, then implement). Plan: litlfred/fhir-harness#124. Thread "fhir-harness IG viewers".

## Why

smart-trust and smart-base commit `fhir-artifact-index/` (index, menu, releases; 1.3 to 1.5 MB each). These were ingested once from the published IG and now drift. smart-immunizations has never committed one, so it has no artefact index on the main site. The code is all in fhir-harness already; only the data sits in the instances. An IG repository declares nothing of fhir-harness's (fhir-harness AGENTS.md, skill ig-build-pipeline): it inherits through `needs`.

Measured on smart-trust's AST: 682 artefacts against 678 committed. 608 are identical, the AST has 4 newer ones and 458 more descriptions, and nothing exists only in the committed copy.

## Steps

- [x] fhir-harness#123: the ig-ast viewer lists IGs inherited through `needs` (`needing`, `lsRemote`, `AST_FAMILY_PREFIXES`)
- [x] fhir-harness#127: `ig-index:build` (`build-ig-indexes.ts`) writes index.json, menu.json and releases.json at publish for every IG instance. Real run: 3 of 3 built.
- [x] folio-assistant: run `ig-index:build` before the IG page steps (docs-site.yml, feature-staging.yml, code-quality-gates.yml); retire `ingest:ig:check` and `ingest:ig-menu:check`
- [x] smart-trust and smart-base: declare `fhir-artifact-index/` builtAtPublish (writer `ig-index:build`), delete the committed index/menu/releases/package.tgz, run SUSHI first
- [x] DAK sidecars (`dak/`): move to smart-base's `ig-site:sidecars` step, never into fhir-harness (`smart-base#198` and `smart-trust#76` open to retire the legacy committed `fhir-artifact-index/dak/` directories; `ig-site:sidecars` in `smart-base` already writes `fhir-artifact-index/sidecars/` at publish via `ig-index:build`)
- [x] Re-pin the index after each merge

## Open points

- Category grouping falls back to the Publisher default by resource type once no committed copy is left to keep it from.
- Published links need a published base, which fhir-harness must not guess.

_2026-10-29T07:35:00Z_ — smart-base#145 (3af02d2) and folio-assistant#2684 (08af24f) merged; smart-trust#71, cat-harness-tools#675 and cat-harness#490 had already merged. folio-assistant runs `ig-index:build` in docs-site, feature-staging and code-quality-gates. Left: delete the unused `ingest:ig:check` / `ingest:ig-menu:check` scripts from package.json, the DAK sidecars step, and the re-pin in folio-assistant#2681. Session https://claude.ai/code/session_01Qmmkt87nxnLXyraNsmmpKH (Drain FHIR and smart layer work).

_2026-10-30T11:10:00Z_ — Ticked steps 3 and 6: `folio-assistant#2689` (`Retire ingest:ig:check and ingest:ig-menu:check`), `fhir-harness#181` (`Retire ingest:ig and ingest-ig-artifacts.ts`), `cat-harness-tools#796` (`Retire the ingest:ig:check checkout test and its declarations`), `smart-base#183`, `smart-trust#74`, and the index re-pins (`folio-assistant#2681`, `folio-assistant#2692`) all merged on `main`. Remaining: retiring the legacy committed `smart-base/fhir-artifact-index/dak/` sidecars (`ig-site:sidecars` already writes `sidecars/`).

_2026-10-30T11:45:00Z_ — Opened `litlfred/smart-base#198` (retiring the 138 legacy committed files under `smart-base/fhir-artifact-index/dak/`, adding `/fhir-artifact-index/sidecars/` to `smart-base/.gitignore`, and updating `smart-base.json`, `AGENTS.md`, and `smart-base/fhir-artifact-index/README.md`) and companion PR `litlfred/smart-trust#76` (retiring the 68 legacy committed files under `fhir-artifact-index/dak/` and updating `smart-trust.json`, `AGENTS.md`, and `fhir-artifact-index/README.md`). Checked locally with `ig-index:build`, `smart:pages`, `bun test smart-base/` (373 pass, 0 fail), `smart-base/kg` (`npm run check` and `npm test`), `check:fhir-harness-exclusions`, `smart-base:document-kinds:check`, and `smart-base:dth-terms:check`. Ready for review/merge and subsequent index re-pin.
