---
# folio-assistant-en68
title: Colons in kg-qa sidecar filenames make the repo unclonable on Windows
status: in-progress
type: task
priority: high
created_at: 2026-09-21T10:08:48Z
updated_at: 2026-09-21T10:08:48Z
parent: folio-assistant-1xhc
---

## What

`git clone` of this repository **fails on Windows** — not at fetch, at
checkout. Seven KG QA sidecars are named `req:<slug>.kg-qa.json`, and NTFS
reserves `:` inside a path component for alternate data streams, so Git
refuses to create the file.

Git aborts the **entire** checkout on the first invalid path, so this is not
seven missing files. It is no working tree at all, for everybody on that
platform, after the whole 869 MiB has already come down.

## How it was found

Reported 2026-09-21 from a user's terminal:

```
Receiving objects: 100% (647920/647920), 869.73 MiB | 9.21 MiB/s, done.
Resolving deltas: 100% (598778/598778), done.
error: invalid path 'cat-harness/test/results/kg-qa/skills/requirements/req:agent-workflow.kg-qa.json'
fatal: unable to checkout working tree
```

`find` over a Linux checkout: exactly **7** paths carry a colon, all under
`cat-harness/test/results/kg-qa/skills/requirements/`, one per requirement.

## Where it comes from

`sidecarPath` (`cat-harness/scripts/kg-audit.ts`) names a `role` or
`requirement` sidecar from `subject.id` rather than from the path stem, and
requirement ids are `req:agent-workflow` &c.
(`cat-harness/skills/requirements/agent-workflow.json`). Role ids happen to be
bare slugs, so only requirements bite today — but **an id never had to be a
legal filename**, so this is general.

`kgQaSidecarPath` (`cat-harness/schemas/kg-qa.ts`) is the one function that
turns a subject into a results path. Its doc comment already owns two
neighbouring invariants — collision-free, and inside the tree `sweepOrphans`
walks. Portability is the third and belongs with them.

## Why nothing caught it

Nothing in ~80 `check:*` scripts or any workflow asked whether a tracked path
can be created. `grep` for `protectNTFS` over the repository: no output. The
shape is invisible from the author's side by construction — the name is legal
on the machine that wrote it, and CI is Linux.

## Done when

1. `kgQaSidecarPath` encodes the stem it composes, **reversibly** — substituting
   `:` for `-` would collide `req:x` with a future `req-x`, which is the one
   guarantee the mirrored results tree exists to provide.
2. The seven files are renamed and `kg:audit:check` is clean — no stale
   sidecar, no orphan. That is the falsification test: if the encoder and the
   rename disagreed, the audit would write seven new files and leave seven
   orphans.
3. A gate over **tracked** paths (`check:portable-paths`), wired into
   `code-quality-gates.yml`. The generator fix protects one writer; it does not
   protect a hand-authored file, which is how these got in.

## Not doing

Not renaming requirement subjects to path-stem naming. It would also fix these
seven — requirements do carry a path — but naming role and requirement
sidecars by id is a deliberate choice elsewhere, and changing it leaves the
general hole open for the next id that carries a colon.
