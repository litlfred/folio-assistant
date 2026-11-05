---
# folio-assistant-69lr
$schema: bean/1.0.0
title: 'CI speed II (c3): publish-time QA witnesses stamp the commit, so main never reuses a PR''s pages'
status: todo
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:07:57Z
updated_at: 2026-11-05T12:07:57Z
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
