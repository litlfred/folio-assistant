---
# folio-assistant-en68
title: Colons in kg-qa sidecar filenames make the repo unclonable on Windows
status: completed
type: task
priority: high
created_at: 2026-09-21T10:08:48Z
updated_at: 2026-09-21T13:45:00Z
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

1. [x] `kgQaSidecarPath` encodes the stem it composes, **reversibly** — substituting
   `:` for `-` would collide `req:x` with a future `req-x`, which is the one
   guarantee the mirrored results tree exists to provide.
2. [x] The seven files are renamed and `kg:audit:check` is clean — no stale
   sidecar, no orphan. That is the falsification test: if the encoder and the
   rename disagreed, the audit would write seven new files and leave seven
   orphans.
3. [x] A gate over **tracked** paths (`check:portable-paths`), wired into
   `code-quality-gates.yml`. The generator fix protects one writer; it does not
   protect a hand-authored file, which is how these got in.

## A fourth item, which arrived from review

The three above scoped the ONE INSTANCE. litlfred on PR #683: *"seems to be
only fixing one issue, not the pattern."* Correct, and the reason this bean's
`## Done when` was too narrow when it was written: composing a filename from an
**id** recurs, and `kgQaSidecarPath` was the instance that happened to be fed
`req:*` first. Five further composers now encode —
`scriptSidecarPath`, `<node.id>.jsonld`, `<spec.id>.json`, `detailRelPath` /
`detailFileName`, `stickyFile` — each a single chokepoint both the writer and
the reader resolve through.

`state-visualizer.ts` REFUSES rather than encodes, because its graph id is also
the site's URL route: encoding would publish `/req%3Ax/` while the declaration
stopped saying where the page is. Same stance `portable-path.ts` takes on
reserved device names — `aux` has nothing to encode.

That pass found a live defect rather than a latent one: `agent-memory` held
**two spellings of one filename**, and `writeDetail` prunes `detail/` against a
keep-set built from that name, so the two diverging would have deleted the file
just written.

## Closed on re-derived evidence, 2026-09-21

Per `bean-coordination` §"Closing a bean whose work has already landed" —
closed on EVIDENCE, re-run here rather than quoted from the PR:

| command | result |
|---|---|
| `bun run check:portable-paths` | ✓ 5,907 tracked paths, all creatable on Windows/macOS/Linux |
| `git ls-files \| grep -c ':'` | **0** — no colon-bearing path remains |
| `git ls-files \| grep -c 'req%3A.*kg-qa.json'` | **7** — the encoded sidecars are on `main` |
| `bun test cat-harness/schemas/portable-path.test.ts` | 18 pass, 0 fail |
| `bun run kg:audit:check` | exit **0** — no stale sidecar, no orphan |
| `grep -c check:portable-paths .github/workflows/code-quality-gates.yml` | **1** — the gate fires in CI |

All six run on `main` at `0a4f0b20`, after PR #683 merged.

**What remains open, and is NOT this bean.** The gate reads `git ls-files`, so
it covers tracked paths only. A generator writing into an ignored build
directory is outside it, and an unportable name there breaks a Windows *build*
rather than a clone. Closing that means deciding which build directories to
walk and when — a design question, deliberately left out of #683 and stated in
`portable-path.ts` rather than left as a silent gap.

## Not doing

Not renaming requirement subjects to path-stem naming. It would also fix these
seven — requirements do carry a path — but naming role and requirement
sidecars by id is a deliberate choice elsewhere, and changing it leaves the
general hole open for the next id that carries a colon.
