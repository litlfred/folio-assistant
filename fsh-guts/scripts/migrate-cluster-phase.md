---
$schema: folio-fsh-guts/v1
title: "migrate-cluster-phase.py"
kind: script
movedOn: 2026-09-20
movedFrom: "cat-harness/scripts/migrate-cluster-phase.py"
bean: folio-assistant-nfgo
summary: >-
  The generalised recipe for phases 2–5 of the computations subdirectory refactor — git mv, witness co-move by scriptFile, path-bridge shim injection, HERE.parent fixups — driven by a cluster name and a glob. Retired because its subject is absent from this repository, but it is the one of the eight that is worth reading: it is the PATTERN the six one-off fixers were each a partial, bug-fixed instance of.
---

# `migrate-cluster-phase.py`

**The one of the eight with transferable content.** Its own docstring says what it
is — *"Generalization of `scripts/migrate-probes-phase1.py` for phases 2-5"* — and
that is the interesting fact: the repository first wrote the move by hand for one
cluster, then generalised it, and then needed three further scripts to fix what
the hand-written version had got wrong.

## Why it is here rather than in `scripts/`

Its subject does not exist in this repository. Measured 2026-09-20:
`cat-harness/computations/` holds **one** file, a `.witness.json`, and **no Python
at all** — no `substrate/`, no `*_probe.py`, and the proposal it cites
(`docs/proposals/computations-subdirectory-refactor.md`) is gone. The phases it
executes are numbered and complete. **A phase script is spent by construction.**

Per [`fsh-guts`](../../cat-harness/skills/folio-core/fsh-guts.md): delete means
relocate. It is still addressable, greppable and citable.

## The lesson, extracted so it survives the script

Four steps in a fixed order, and the order is the content:

1. **`git mv`**, so history follows the file rather than recording an add and a
   delete — which is what makes `git log --follow` able to answer "where did this
   come from" a year later. (Worth stating because the opposite happened to these
   very files: the `cat-harness/` inversion recorded an Add at the new path, so
   `--diff-filter=A` on all seventeen of them names one bulk import and tells you
   nothing. `--follow` was needed to recover 2026-09-17.)
2. **Co-move the witness by `scriptFile`**, not by filename adjacency. A witness
   belongs to the script that declares it, and a move that pairs them by directory
   silently re-parents any witness whose name does not match its producer.
3. **Inject the path bridge**, because a moved script's `HERE`-relative loads now
   resolve one level too deep. This is the step the six one-off fixers were each
   repairing after the fact.
4. **`HERE.parent` fixups** last, since 3 changes what 4 has to look for.

And the meta-lesson, which is the reason the bean that retired these exists:

> **A codemod is a commit, not a committed script.** Ten of the seventeen files in
> this family exist because a bulk edit was preserved as a file instead of being
> preserved as a diff. The diff is in the history either way; the file then rots
> in `scripts/` pointing at a layout nobody can reconstruct.

## Its own partner

`migrate-probes-phase1.py` is the hand-written phase 1 this generalises, and the
two reference each other. They moved together, so the cross-reference still
resolves.
