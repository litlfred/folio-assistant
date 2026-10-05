---
# folio-assistant-j9cs
title: 'MOUNT TOOLS DECLARED ON STORAGE: a subgraph names the tool that mounts it; no central mounter (owner ruling 2026-10-04)'
status: todo
type: feature
created_at: 2026-10-04T17:04:23Z
updated_at: 2026-10-04T17:04:23Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04, verbatim: *"there should not be a central registry for declaring mount tools and subgraph types"*.

## What exists, measured 2026-10-04
- `state:mount` (`branch-store.ts`) mounts every tip-keyed directory. It switches on `keyedBy` centrally: tip mounts, route is read by its generator's `--check`, and commit belongs to qa-store.
- Family-keyed graphs are mounted by tools nobody declares: `fhir-harness/scripts/ig-cache.sh` for fhir-ast, and `cat-harness/scripts/lake-cache.sh` with `.github/actions/lake-cache-restore` for lake-cache. These tools are what the shell mirrors of `special-branches.json` exist to serve.

## The rule
A directory's `storage` names the Tool that mounts it, as a declared Tool node (tools are already KG nodes), and the harness that owns the tool declares it. A generic mount command dispatches to the named tool rather than knowing every keying itself.

## Done when
- [ ] `storage` carries the mounting Tool's id, and a check refuses an id that names no declared Tool
- [ ] ig-cache.sh and lake-cache.sh are declared Tool nodes in the harnesses that own them, named by the fhir-ast and lake-cache declarations
- [ ] `state:mount` dispatches through the declaration for every keying it does not implement itself
- [ ] the shell and Python mirrors read the prefix from the declaration (rva2), not from a central table
