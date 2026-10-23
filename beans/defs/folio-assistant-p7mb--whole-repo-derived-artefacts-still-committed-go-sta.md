---
# folio-assistant-p7mb
$schema: bean/1.0.0
title: 'Whole-repo-derived artefacts still committed go stale on main after concurrent merges: build them at publish (owner option 1, 2026-10-23)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-23T07:55:00Z
updated_at: 2026-10-23T13:35:00Z
parent: folio-assistant-1xhc
---

## Why

A file generated from the WHOLE repository goes stale on `main` when two PRs merge one after the other. Each PR regenerated it for its own branch, and neither copy includes the other PR's change. A direct push or web upload has the same effect. Post-merge regen (bean `ey1c`) repairs this after the fact, but it cannot open its repair PR here: `GitHub Actions is not permitted to create or approve pull requests`, and `HARNESS_BOT_ID` is unset.

The owner, 2026-10-23, asked "why are we getting into repair on a post-merge process? sounds like upstream process failure", then chose **option 1: build these at publish**. The alternatives were not taken: requiring up-to-date branches, an agent-side repair stopgap, and leaving it.

This extends the `builtAtPublish` ruling of 2026-10-14 ("B1", bean `34cm`; `cat-harness/schemas/built-at-publish.ts`) to the derived files that are still committed.

## Measured: what went stale on cat-harness main

cat-harness's post-merge regen run 39786173033 (2026-10-22, main `9b38225`) found these stale and repaired them. The repairs never landed:
`library:viz`, `uploads:viz`, `voices:viz`, `folio:viz`, `document-kinds:viz`, `bpmn:checklist`, `check:glossary`, `skill:register`, `lsi:skills`, `slice:sqlite`, `kg:detangle`, plus 13 directory READMEs (`readme:subgraphs`).

## Done when

- [x] Each writer above is classified, with its reason: a RENDERING that can be `builtAtPublish` (`because: checkout` or `state`), or an input something gated reads from the checkout and so must stay committed. (Classified below, 2026-10-23.)
- [x] Every rendering is declared `builtAtPublish` in its owning instance, gitignored and untracked, and the `:check` that read it is satisfied by `isBuiltAtPublish` or retired with its reason. (`litlfred/cat-harness#420` merged `8f85b8787d` at `2026-10-23T09:14:34Z`.)
- [x] Whatever must stay committed is listed with why, and with how it is kept current without a post-merge repair PR. (Owner ruling 2026-10-23 below: accept the lag on directory READMEs; `glossary/generated`, `detangle` and `lsi:skills` stay committed inputs.)
- [ ] A post-merge regen run on a layer's `main` reports `clean` twice in a row after unrelated merges (negative control). (`post-merge:regen` already exited 0 with `changedFiles: []` on `cat-harness` `main` `764f4bdce1` in run `39935673805`; `layer-post-merge-regen.yml` PR updates step 6 so directory README lag is advisory rather than triggering a repair PR.)

## 2026-10-23T08:05Z — classified (lane C, read from the code; no writers run)

The run's own report shows `changedFiles: []`, and the only tracked change came from the caller's README step: 13 directory READMEs. So "stale" in the regen's list largely meant "re-rendered an untracked builtAtPublish file", not "main is stale".

| writer | outputs | verdict |
|---|---|---|
| library:viz, uploads:viz, voices:viz, document-kinds:viz, slice:sqlite | `docs/assets/{library,voices,slices}/**`, `docs/en/cat-harness/{library,uploads,voices,document-kinds}/**` | ALREADY builtAtPublish. Post-merge regen should stop counting them as stale (follow-up) |
| folio:viz | root `docs/assets/folio/index.json` and `docs/en/cat-harness/folio/index.html` (per-instance subdirs already builtAtPublish) | RENDERING: move the root pair (`checkout`) |
| glossary (`folio-assistant-core/scripts/glossary-page.ts`) | 14 SKOS files not yet listed (`bootstrap--*`×3, `bootstrap-tools--*`×3, `cat-harness--*`×6, `folio-assistant-core--guideline-domain`, `folio-assistant-sci--kg-schema-fields`) | RENDERING: move (`checkout`) |
| glossary | `folio-assistant-core/glossary/generated/<inst>/*.glossary.json` | COMMITTED-INPUT: read by gated `check:term-mapping`, glossary-page itself, `schemas/glossary.test.ts` |
| bpmn:checklist | `<stem>.checklist.md` beside each diagram | COMMITTED by the owner's ruling (2026-10-14); derived from its own instance only, so it does not go stale on a cross-PR merge |
| lsi:skills | `test/results/lsi/cat-harness/skills.lsi.json` | COMMITTED-INPUT: read by gen-lsi-viz, qa-refresh, kg-audit |
| kg:detangle | `test/results/detangle/**/*.detangle.json` | COMMITTED-INPUT: read by gen-uml-overview, degradation, group-depth |
| readme:subgraphs | generated region of authored `README.md` in every declared directory | COMMITTED: the file is authored, so the region cannot move out without changing that. This is the one that actually went stale (13 files) |
| skill:register | an orchestrator; its own output is a QA sidecar | not an artefact writer |

**Next:** a PR declaring the 14 SKOS files and the root folio pair `builtAtPublish`, and a fix so post-merge regen ignores builtAtPublish outputs. The READMEs, and the committed inputs that derive from the whole checkout (glossary/generated, detangle), need an owner call: they cannot move to publish without changing who reads them.

## 2026-10-23 — owner ruling on the directory READMEs: accept the lag (option 1)

The generated table in each declared directory's README is the one committed artefact that does go stale on main after concurrent merges. It has been a non-blocking QA report since 2026-10-16. The owner chose to accept the lag: no change, and the next PR that touches the directory refreshes the table. The alternatives were not taken: moving the table to the site at publish, and requiring up-to-date branches.

Left on this bean: cat-harness#420 (the two missing above-layer SKOS exports). That closes p7mb's renderings. glossary/generated, detangle and lsi:skills stay committed inputs, as classified above.

_2026-10-23T08:35Z_: re-parented from `hfag`, which was completed on 2026-10-22, to `1xhc` (CI reliability; also the parent of `5o5c`). `check:bean-rollup` failed on an open child under a completed parent.
