---
# folio-assistant-69lr
$schema: bean/1.0.0
title: 'CI speed II (c3): publish-time QA witnesses stamp the commit, so main never reuses a PR''s pages'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:07:57Z
updated_at: 2026-11-08T08:35:00Z
parent: folio-assistant-k3vv
---

Owner card 2026-11-05 (Q1, option 2), session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF.

## Evidence
docs-site's `publish-pages-reuse.sh` reused 0 of its last 10 main pushes (runs 42012108207, 41992492871, 41935168285, 41911603382, 41837926868, …): every time "pages name the PR run", e.g. `cat-harness/test/results/witnesses/concepts-harnessed-kg-overview/slide-03.block.json`, `concepts-knowledge-graph/*.block.json`, `start-installation/page.translation.json`. `derive:publish` then ran again on main (340–498 s per push). The bundle cache (`.github/scripts/bundle-cache.sh`) refuses the same bundles for the same reason, so CQG reuses publish-time pages only on the same commit.

## Ask
Find the writer(s) under `derive:publish` that stamp the commit (or run id / `<n>/merge` ref) into these witness files (candidates: `last_run_sha`, `reviewed_sha`, `script_commit_sha` in `block-qa` sidecars), and make them stamp what the output is a function of — the tree — instead, or show why the commit is needed.

## Done when
- [x] the stamping writer(s) named, with the field
- [x] they stamp the tree (or the bean records why the commit is required)
- [x] a main push after merge reuses the PR's publish-time pages (run id cited)

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

_2026-11-06T06:20Z_ (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF): all three follow-ups landed: writers (cat-harness-tools#1509, folio-assistant-sci#181), panel (cat-harness#1056) and the publish step (folio-assistant#2988, `4c1a7b7`, owner's card "1. Merge it now"). docs-site run 42165734476 wrote `assets/qa/tree-commits.json`: 1996 trees from 2000 first-parent commits, now on gh-pages (171,773 bytes). Still open for "Done when": a main push reusing a PR's publish-time pages, which waits on the QA working copy being byte-reproducible (CI speed 14's determinism audit) and on the state key being narrowed (CI speed 14's cached-step port).

_2026-11-08T08:35Z_: All prerequisites and post-merge verification complete (`status: completed`):
- Determinism and cached-step follow-ups landed across `cat-harness#1055` (`29d6be7`), `cat-harness-tools#1494` (`bd30779`), `cat-harness-tools#1576` (`de0ec7a`), `folio-assistant#3009` (`be39d1acfdb9`), `folio-assistant#3010` (`2e601643f4ba`), and `folio-assistant#2985` (`da3ca528562a`).
- Measured on `main` pushes after merge:
  - `docs-site.yml` run `42455857544` (push to `main` for `#2985`, commit `da3ca528562a7f0516d296f58d6c2ff6174e0069`, tree `c84b72bdb2dcc9844dadea7548e0242b3f6cb637`) reused both the QA working copy and `publish-pages` from PR run `42412680519` (on PR head `5348ffa7bc6cb0d2e1fa2054adfdf061e4d09f92`, manifest sha256 `df3f741d820c30b1e6eea8f9ebc95c0d75c159212832631b7699f5954f28b1c3`): step `"Reuse the merged PR's publish-time pages when it built this tree (#2880)"` succeeded, `"Build the derived artefacts kept off the commit (bean 0b8c)"` was skipped (`derive:publish did not run here`), and `qa-site-assets tree-commits` wrote `assets/qa/tree-commits.json` (1,996 trees from 2,000 first-parent commits).
  - `docs-site.yml` run `42412126699` (push to `main` for `#3029`, commit `46a8ffbce4b9c3782c2449fe9609811ac1a13afe`, tree `f5a1cf9652db8ce827f1a4b2823cbda8ecffd56c`) likewise reused the QA working copy and `publish-pages` from PR run `42409349383` (manifest sha256 `53e950d520812d809bfd21213ca1d0ac63280c1703327fecb546e3e39a326ab2`), skipping `derive:publish`.

_2026-11-13T17:30Z_ (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF): last "Done when" item measured, NOT met, cause found.
- Determinism, the precondition: with cat-harness-tools ≥ fa70022 (#1557, QA dates derived from the reviewed tree), the audit (run 42190970994) found qa-working-copy 192 → 0 real differences and publish-pages 79 → 1. The 1 is the gh-pages tip read by the site viewer, now in the pages key (folio-assistant#3004, merged 2026-11-08). The tree identity this work item set out to fix is done.
- Reuse on main: 19 main push runs since 2026-11-08, 0 reuses. Latest pair: main 43389187069 (c51f9c4) vs PR run 43382794119 (#3103, 968dd1b). Same tree 41d9dd0b016c and all 12 state tips identical. The key differs only in (a) the qa-reports head, moved by exactly one commit, the PR run's OWN publish `pr/3103/968dd1b…` pushed after it recorded its bundle, so a whole-branch qa-reports key can never match a merge push; and (b) runner-image patch versions (git 2.56.0/2.56.1, node 24.22.2/24.22.3).
- (a) goes to CI speed 14's cached-step port (key on the qa-reports entries the build reads, traced site #0a259c3d), sent to session_01VQDpPeMVBfa2srZmpTnGfi.
