---
# folio-assistant-69lr
$schema: bean/1.0.0
title: 'CI speed II (c3): publish-time QA witnesses stamp the commit, so main never reuses a PR''s pages'
status: in-progress
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:07:57Z
updated_at: 2026-11-05T12:55:20Z
parent: folio-assistant-k3vv
---

Owner card 2026-11-05 (Q1, option 2), session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF.

## Evidence
docs-site's `publish-pages-reuse.sh` reused 0 of its last 10 main pushes (runs 42012108207, 41992492871, 41935168285, 41911603382, 41837926868, …): every time "pages name the PR run", e.g. `cat-harness/test/results/witnesses/concepts-harnessed-kg-overview/slide-03.block.json`, `concepts-knowledge-graph/*.block.json`, `start-installation/page.translation.json`. `derive:publish` then ran again on main (340–498 s per push). The bundle cache (`.github/scripts/bundle-cache.sh`) refuses the same bundles for the same reason, so CQG reuses publish-time pages only on the same commit.

## Ask
Find the writer(s) under `derive:publish` that stamp the commit (or run id / `<n>/merge` ref) into these witness files (candidates: `last_run_sha`, `reviewed_sha`, `script_commit_sha` in `block-qa` sidecars), and make them stamp what the output is a function of — the tree — instead, or show why the commit is needed.

## Done when
- [ ] the stamping writer(s) named, with the field
- [ ] they stamp the tree (or the bean records why the commit is required)
- [ ] a main push after merge reuses the PR's publish-time pages (run id cited)

## Owner ruling 2026-11-05 (card Q4, option 1): the tree is the identity

Found (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF): `reviewed_sha: gitHeadSha()` in `cat-harness-tools/pipeline/translation-block-qa.ts`, and the same stamp in `qa-agent-entry.ts`, `script-sweep.ts`, `qa-merge-findings.ts`, `untainted-verification.ts`, `translation-roundtrip.ts`, `src/qa-agent-write.ts`. Read by `pipeline/qa-witness.ts` (panel `sha`) and described in `schemas/sdlc/run-context.ts`.

Why the tree, not the commit: on a PR, HEAD is `refs/pull/<n>/merge`, a commit GitHub replaces when main moves and may garbage-collect. So a reused `reviewed_sha` on main would address a commit that can vanish, which breaks the 2026-09-22 rule ("A CI verdict is reproducible from the `reviewed_sha` it records"). Main's merge commit has the same tree, so the tree id stays reachable and names exactly the inputs. `sameScriptVerdict` already treats the verdict as a function of its inputs, not of the commit.

Ruling: witnesses carry `reviewed_tree` (HEAD^{tree}) as the address; `reviewed_sha` leaves the witnesses; the QA panel resolves a commit on main carrying that tree for its link; the commit that ran stays in the per-run record. `script_commit_sha` is kept unless the reuse runs show it differs between the PR and main (`script_hash` already identifies the code).

## Landed 2026-11-05 (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF)

- cat-harness-tools#1536: `kind:json-schemas --check` judges the generator's own output when a harness builds the kind schemas at publish (owner card via the merge steward: "build it at publish").
- cat-harness#1056: QA panel shows `reviewed_tree` and links it through `assets/qa/tree-commits.json`; `schemas/kinds/` built at publish, no longer committed.
- cat-harness-tools#1509: every platform QA writer stamps `reviewed_tree` (HEAD^{tree}), declared in the block-qa interchange schema.
- cat-harness-tools#1530: `qa-site-assets.ts tree-commits` writes the tree-to-commit index (owner card Q5, option 1).
- folio-assistant-sci#181: the three sci writers stamp `reviewed_tree`.

Remaining: the six-layer re-pin after #2954, then a folio-assistant PR adding the `tree-commits` step to `docs-site.yml`; then the "Done when" items below can be measured (a main push reusing a PR's publish-time pages).
