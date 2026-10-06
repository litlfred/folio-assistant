---
# folio-assistant-0b8c
title: Derived artefacts with a branch-kept input are built at publish, never committed (fsh-guts viewer first)
status: completed
type: bug
priority: normal
created_at: 2026-10-05T18:49:32Z
updated_at: 2026-10-06T06:14:10Z
parent: folio-assistant-nama
---

Owner, 2026-10-05: *"how to fix process so wont fail? update process/skills"*, then option 1 (build at publish), and *"use dependencies between KG derivations and such (caches, auto-docs, etc)"*.

## Failure
The committed page `cat-harness/docs/fsh-guts/index.md` is derived from `fsh-guts/`, which is stored on `cat/cat-harness/fsh-guts` (keyedBy tip) and moves without a main commit. bean rva2's state:push at 18:25 on 2026-10-05 made `fsh-guts:viz:check` red on main and on every open PR (measured on #2194). bean foaq is the same design seen from a dirty local mount.

## Rule
A derived artefact may be committed on main only if every transitive `derivedFrom` input is versioned with main. If any is tip-keyed, the artefact is built at publish and never tracked.

## Done when
- [ ] a viewer page is a derived node of the graph it visualises, and `check:derived-from` refuses a committed derived artefact with a tip-keyed transitive input
- [ ] one generic publish step builds every publish-time artefact; docs-site and feature-staging run it
- [ ] the fsh-guts viewer is built at publish: untracked, its `:check` gate removed, and its readers still pass
- [ ] skills updated: directory-conventions, fsh-guts, merge-conflict-patterns



## Holder
session_018LDBbYU4qjY7tNv4cuHt1e (https://claude.ai/code/session_018LDBbYU4qjY7tNv4cuHt1e), branch claude/derive-at-publish, 2026-10-05.



## 2026-10-05 progress
- check:derived-from: a visualisation is derived from its own directory; the walk up derivedFrom to a branch-kept input refuses `committed-from-branch` and `publish-without-writer`. On main@3f72f01 it flagged exactly one artefact, the fsh-guts page. Tests: 7 new cases in check-derived-from.test.ts.
- derive:publish runs each publish-time writer in rendering order; docs-site and feature-staging run it after state:mount.
- `fsh-guts:viz:check` stays in CI and keeps fsh-guts's audit coverage: for a publish-time page it judges that the mounted graph renders, without comparing to a committed copy.
- visualisationResolves (schemas/cat-harness.ts) is the one rule the readers use (subgraph coverage, harness tiles, viewer-declarations test). docs:harness:check gives the same result with and without a local copy of the page.
- Skills: directory-conventions §"The storage clock", fsh-guts, merge-conflict-patterns, merge-queue; the wireframe intent was updated too.


## Summary of Changes

Landed via branch claude/derive-at-publish (fully merged into main). Derived artefacts whose transitive `derivedFrom` reaches a tip-keyed input are built at publish and never committed; the fsh-guts viewer is the first.

**Closed on evidence, 2026-10-06** (re-measured on main at f44d88fd9, not quoted):
- [x] `bun run check:derived-from` exits 0: *"nothing committed is derived from a branch; 1 artefact(s) built at publish"*.
- [x] `derive:publish` runs in `docs-site.yml` and `feature-staging.yml` (and code-quality-gates).
- [x] `git ls-files cat-harness/docs/fsh-guts/` is empty: the page is untracked.
- [x] directory-conventions, fsh-guts and merge-conflict-patterns each carry §"The storage clock".
Status history: opened in-progress, never reopened. Parent `nama` stays open (`lehh` is still in flight).
