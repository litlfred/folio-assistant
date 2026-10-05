---
# folio-assistant-0b8c
title: Derived artefacts with a branch-kept input are built at publish, never committed (fsh-guts viewer first)
status: in-progress
type: bug
priority: normal
created_at: 2026-10-05T18:49:32Z
updated_at: 2026-10-05T18:49:44Z
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
