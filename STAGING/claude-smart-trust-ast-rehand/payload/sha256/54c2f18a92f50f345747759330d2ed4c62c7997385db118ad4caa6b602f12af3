---
# folio-assistant-j9cs
title: 'MOUNT TOOLS DECLARED ON STORAGE: a subgraph names the tool that mounts it; no central mounter (owner ruling 2026-10-04)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T17:04:23Z
updated_at: 2026-10-05T17:17:44Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04, verbatim: *"there should not be a central registry for declaring mount tools and subgraph types"*.

## What exists, measured 2026-10-04
- `state:mount` (`branch-store.ts`) mounts every tip-keyed directory. It switches on `keyedBy` centrally: tip mounts, route is read by its generator's `--check`, and commit belongs to qa-store.
- Family-keyed graphs are mounted by tools nobody declares: `fhir-harness/scripts/ig-cache.sh` for fhir-ast, and `cat-harness/scripts/lake-cache.sh` with `.github/actions/lake-cache-restore` for lake-cache. These tools are what the shell mirrors of `special-branches.json` exist to serve.

## The rule
A directory's `storage` names the Tool that mounts it, as a declared Tool node (tools are already KG nodes), and the harness that owns the tool declares it. A generic mount command dispatches to the named tool rather than knowing every keying itself.

## Done when
- [x] `storage` carries the mounting Tool's id, and a check refuses an id that names no declared Tool. `storage.tool`; `check:tools` (#2192). smart-trust's AST names `ig-cache`, and the site names `gh-pages`.
- [ ] ig-cache.sh and lake-cache.sh are declared Tool nodes in the harnesses that own them, named by the fhir-ast and lake-cache declarations
- [x] `state:mount` dispatches through the declaration for every keying it does not implement itself. It lists each family and route store with the Tool its `storage.tool` names and that Tool's command (#2192). It does not RUN them, because a family member is chosen by a key only the caller knows.
- [ ] the shell and Python mirrors read the prefix from the declaration (rva2), not from a central table

_2026-10-05T14:33:45Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-10-05_ — Box 2: both scripts are now declared Tool nodes in the harnesses that own them — `ig-cache` in fhir-harness (already), `lean-cache` moved from cat-harness to folio-assistant-sci (77201e7cf62a), which kinds/lake-cache.json names as owning `the kind and the tool`. smart-trust's AST names `ig-cache`; qou's lake-cache entry does not yet name `lean-cache`, because `storage.tool` exists only from #2192's schema — it follows the qou pin bump after #2192 merges. Box 4: done for lake-cache (all five mirrors, see rva2). NOT done for fhir-ast, and not mechanical: in the monorepo the declaring folio (smart-trust/, with `repository: litlfred/smart-trust`) is not the IG root ig-cache.sh runs against, so where ig-cache.sh should look is a design question for the owner. Both sides carry the same prefix today, so nothing is broken meanwhile.
