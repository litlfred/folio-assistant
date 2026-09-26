---
$schema: folio-fsh-guts/v1
title: "The six computations-refactor fixers"
kind: script-group
movedOn: 2026-09-20
movedFrom: "cat-harness/scripts/"
bean: folio-assistant-nfgo
summary: >-
  Six spent one-shots from the computations subdirectory refactor — migrate-probes-phase1, fix-moved-scripts, fix-root-script-shim, fix-cross-cluster-witness-loads, materialize_iw_queue, wire_stale_claims. Each executed or repaired a numbered phase whose subject is absent from this repository. One record for the six rather than six near-identical ones, because what they have in common is the whole finding.
---

# The six computations-refactor fixers

One record for six files, because a page each would say the same thing six times
and the thing they share **is** the finding.

| file | bytes | what it did |
|---|---|---|
| `migrate-probes-phase1.py` | 9,868 | executed phase 1: moved `*_probe.py` into `probes/` |
| `fix-moved-scripts.py` | 7,773 | *"post-move corrections for Phase 1/2"* — two bugs in the shim injector |
| `fix-root-script-shim.py` | 5,572 | added a bridge import to root scripts after phase 6 moved `substrate/` |
| `fix-cross-cluster-witness-loads.py` | 7,795 | rewrote `HERE / "X.witness.json"` to `_path_bridge.witness_path(...)` after phases 1–4 |
| `materialize_iw_queue.py` | 7,064 | built the integration-watcher queue from audit witnesses |
| `wire_stale_claims.py` | 7,616 | inserted `computation:` fields into content blocks from `stale-claims.tsv` |

All born 2026-09-17 in the same commit — the bulk import (PR #209) — so they are
the fossil record of reorganisations in the **source** repository, not in this one.
That corrects the bean's own framing, which read them as this repository's
stratigraphy.

## Why they are spent, established rather than assumed

Two facts, both measured on 2026-09-20, and the second is the one that matters:

1. **Their subject is absent.** `cat-harness/computations/` holds **one** file, a
   `.witness.json`, and **no Python at all** — no `substrate/`, no `*_probe.py`.
   The proposal they cite,
   `docs/proposals/computations-subdirectory-refactor.md`, is gone.
2. **They are numbered phases, and they say so themselves** — "Phase 1",
   "post-move corrections for Phase 1/2", "After Phases 1-4", "during Phase 6".

The second is what makes this a judgement rather than a guess. *"Absent from this
repository"* alone is **not** evidence of death here: `d308` records that
`content/pipeline/*.ts` are invoked from a **folio's** `package.json`, which cannot
be read from this checkout, so four codemods in the same family were **kept** on
exactly that reasoning. The difference is that a phase script is spent **by
construction**: an executed migration does not run twice, and no folio can be
holding an entry point for phase 1 of a refactor that has already reached phase 6.

## The rule they are evidence for

> **A codemod is a commit, not a committed script.**

Four of the six are corrections to corrections — `fix-moved-scripts` repairs the
shim injector, `fix-root-script-shim` and `fix-cross-cluster-witness-loads` repair
what the moves broke. That chain is the argument: each was a bulk edit preserved as
a file rather than as a diff, and the diff was in the history the whole time.

The pattern underneath them, extracted so it outlives them, is in
[`migrate-cluster-phase.md`](migrate-cluster-phase.md) — the generalisation these
six were each a partial, bug-fixed instance of.

## Restoring one

`git mv` back. Nothing was deleted, the bodies are here beside this record, and
`git log --follow` still reaches 2026-09-17.
