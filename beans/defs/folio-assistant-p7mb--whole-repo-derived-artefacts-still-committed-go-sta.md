---
# folio-assistant-p7mb
$schema: bean/1.0.0
title: 'Whole-repo-derived artefacts still committed go stale on main after concurrent merges: build them at publish (owner option 1, 2026-10-23)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-23T07:55:00Z
updated_at: 2026-10-30T13:19:00Z
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
- [ ] A post-merge regen run on a layer's `main` reports `clean` twice in a row after unrelated merges (negative control). (`post-merge:regen` already exited 0 with `changedFiles: []` on `cat-harness` `main` `764f4bdce1` in run `39935673805`; open PR `litlfred/cat-harness-tools#590` `e6a9160` updates `.github/workflows/layer-post-merge-regen.yml` step 6 so directory README lag is advisory rather than triggering a repair PR.)

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

## 2026-10-23T16:16:24Z: post-merge regen stops counting builtAtPublish outputs as stale (follow-up)

This is the follow-up named in the classification table. It is `litlfred/cat-harness-tools#614` (draft; issue `#613`). `post-merge:regen` now watches each writer run. When a writer changed only paths its instance declares `builtAtPublish` (checked with `isBuiltAtPublish`), its check goes in `builtAtPublishChecks` rather than being listed stale or repaired, and it stays out of the repair PR. A writer that also changes a committed file is still a stale check. Tests: `scripts/tests/post-merge-regen.test.ts` (15 pass); the new stale-vs-built-at-publish test fails without the fix.

Cited run: cat-harness `39786173033` (stale `library:viz`, `uploads:viz`, `voices:viz`, `document-kinds:viz`, `slice:sqlite`, with `changedFiles: []`). Later runs (`39935673805`, `39968341288`) could not be re-read: Actions job logs are blocked from this session, and the jobs publish no check-run summary. The README step was already made advisory in `#590` and is unchanged.

## 2026-10-24T17:40:00Z — connected-agent audit of `cat-harness` `post-merge-regen` run `40083008400` (`job 120840228113`) and PRs (`cat-harness-tools#771`, `cat-harness#606`)

Read the full job log of `litlfred/cat-harness` `post-merge-regen.yml` run `40083008400` (`job 120840228113`, `2026-10-24T09:42:19Z`, `head_sha: 2e668b2db1`) and the automated repair commit `554488c62ca9` (`automation/post-merge-regen-2e668b2db1`, 30 files):
- **Why `job 120840228113` exited `CODE: 1` (`status: "unrepaired"`)**:
  1. `unrepairedChecks` (2): `qa:attestations:migrate:check` (exited `3` on `smart-base@574df772`'s `a-mock-session.attestations.json` whose directory moved before `smart-base#107` updated `subject.path`) and `external-schemas:check` (`cat-harness-tools/package.json` ran `external-schemas.ts` without `--write`, and `cat-harness/external-schemas/omg-bpmn-2.0.json` lacked `omg:formalExpression`).
  2. Cross-layer moves counted as caller `committed` moves (`glossary:pot:check`, `agent-memory:check`, `ig-ast:schema:check`, `gen:jsonld:check`): `treeMoveTracker` in `post-merge-regen.ts` was not scoped to `INSTANCE`, so writes into mounted sibling layers (`folio-assistant-core`, root `.agents/rules/agent-memory.md`) were counted as `cat-harness` committed moves.
  3. `publish-check.ts`-routed checks (`check:glossary`, `node-kind:pages:check`, `subgraph:jsonld:check`, `slice:sqlite:check`), dependent `builtAtPublish` checks (`check:navbar-consistency:check`), and `COVERED`-folded checks (`skill:register:check`) wrote during Step 1 and saw `0` writer runs in Step 2.
  4. 23 files in `554488c62ca9` under `docs/en/cat-harness/{bean,software-library,attestations/folio-assistant-core,attestations/smart-base}/` were publish-time outputs not yet listed in `cat-harness.json` `builtAtPublish` (`because: "checkout"`).
- **Opened PRs**:
  - [`litlfred/cat-harness-tools#771`](https://github.com/litlfred/cat-harness-tools/pull/771): scopes `treeMoveTracker` to `opts.instance` (`process.env.INSTANCE`), watches `publish-check.ts`-routed checks on their check invocation, classifies Step-1-failed / Step-2-current / 0-caller-committed-move checks (including `COVERED`-folded checks) as `builtAtPublishChecks`, adds `--write` to `"external-schemas"`, repairs stale `subject.path` in `migrate-qa-attestations.ts`, and accepts string `scheme` in `check-term-mapping.ts` `termState`.
  - [`litlfred/cat-harness#606`](https://github.com/litlfred/cat-harness/pull/606): declares `docs/en/cat-harness/{bean,software-library,attestations/folio-assistant-core,attestations/smart-base}/` in `cat-harness.json` `builtAtPublish` (`because: "checkout"`), untracks `docs/en/cat-harness/bean/index.html`, handles move-in-flight role extensions (`lean-toolchain`) in `schemas/scenario-overlay.ts`, and refreshes the 7 stale committed artefacts (`external-schemas/omg-bpmn-2.0.json`, `docs/assets/folio/index.json`, `docs/assets/prov/merge-train--train-6.prov.jsonld`, and 6 `docs/assets/glossary/*.skos.jsonld` files).

_2026-10-30T11:10:00Z_ — Progress update: `litlfred/cat-harness-tools#590` (`2026-10-23T15:51:09Z`), `#614` (`2026-10-23T16:37:25Z`), `#771` (`2026-10-29T07:26:28Z`), and `litlfred/cat-harness#606` (`2026-10-29T07:27:15Z`) all merged on `main`. Box 4 remains open: `post-merge-regen.yml` on `cat-harness` `main` (runs `40897480812` and `40900325607`) currently hits the 2h0m job timeout in step 11 (`Run post-merge regen in the composed index`).

_2026-10-30T13:19:00Z_ — Diagnosed the 2h0m timeout in `post-merge-regen.yml` (`job 123530439008` of run `40897480812`, `job 123540518890` of run `40900325607`) and opened `litlfred/cat-harness-tools#885`:
1. **Recursive 25-minute `qa:refresh` rebuilds inside `uml:overview:check`**: At cancellation (1h58m, >125,000 spawned PIDs), the active process tree was `post-merge:regen` → `uml:overview:check` (`publish-check.ts uml:overview`) → `gen-uml-overview.ts` → `requireCurrentWorkingCopy` → `ensureWorkingCopy` → `qa:refresh` → `skill:register`. Because `fa/cat-harness` is a gitignored mount in the composed index, `trackedQaFiles` saw 0 git-tracked files and ran `qa:refresh` in `computed` mode across all 25 `QA_WRITERS` (~25m), and later checks in the same pass (`docs:pages:check` touching `*/test/results/witnesses/**`) invalidated `build/regen-cache/qa-working-copy.json`, causing `uml:overview:check` to re-run `qa:refresh` on every pass. Fixed by setting `QA_WORKING_COPY_BUILDING=1` (`BUILDING_ENV`) in `checkPostMergeRegen`'s `baseRunner` (since `post-merge:regen` already checks and repairs every QA writer as its own pair over the mounted instances' committed `test/results/` working copy).
2. **Redundant full-suite re-execution in `regenToFixpoint`**: Because ~18 `builtAtPublish` checks fail in Step 1 (`dryRun: true`) on a fresh checkout, `checkPostMergeRegen` always enters `regenToFixpoint`, which previously had no `skip` or `narrow` hooks — re-running all ~65 clean checks (including multi-minute `translation:block-qa:check` and `kg:audit:all:check`) in Pass 1 and Pass 2+, and disabling the barren-pass check (`lastChange === undefined`). Fixed by passing `skip` and `narrow` hooks to `regenToFixpoint` so Pass 1 skips pairs whose own check/residual passed in the audit pass, Pass 2+ skips passing pairs unless a committed file moved in the previous pass that hits their declared inputs, and `narrow.begin` measures per-pass moves so barren passes settle immediately.
