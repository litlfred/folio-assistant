---
# folio-assistant-nfgo
title: 'SCRAP: report the 17 one-shot migrations with sizes and ages — the decision is the owner''s'
status: completed
type: task
priority: low
created_at: 2026-09-20T04:36:04Z
updated_at: 2026-09-20T14:46:19Z
parent: folio-assistant-d308
---

The SCRAP row of `d308`. **17 files** — `migrate-*`, `codemod-*`, `fix-*`,
`wire_stale_claims`, `materialize_iw_queue`, `audit-wiring-migrate`,
`scripts/migrations/`.

These are the fossil record of previous reorganisations of this repository:
`fix-moved-scripts.py`, `fix-root-script-shim.py`,
`fix-cross-cluster-witness-loads.py`, `migrate-cluster-phase.py`,
`migrate-computation-paths.ts`, `migrate-cites.ts`, `migrate-lean-refs.ts`,
`codemod-leanval.ts`, `codemod-refterm.ts`, `codemod-val.ts`.

**BPMN:** none. That is the finding, not a gap in the analysis. A one-shot codemod
serves no task in any process, which under the owner's rule — *"the code needs to
do something"* — is exactly what disqualifies it.

## This bean does not delete anything

`deletion-requires-confirmation`: an agent never removes a durable artefact on its
own initiative. It reports what would go, **with sizes and ages**, and waits.

So the deliverable here is a REPORT — 17 paths, each with its size, its
last-touched date, and the reorganisation it belonged to — posted for the owner,
and nothing else. The owner decides. If the answer is keep, the answer is keep,
and the row stays in `d308` as a known permanent exception rather than a pending
action.

## The observation worth keeping either way

Ten of the seventeen exist because this repository has reorganised its own file
layout enough times to leave stratigraphy. `d308` proposes another reorganisation.
Whatever is decided about these files, the next migration should not add an
eighteenth: a codemod is a commit, not a committed script.

## Done when

- [x] the 17 paths reported with size and last-touched date
- [x] each attributed to the reorganisation it belonged to, where git can say —
      and the answer **corrects this bean's framing**: all 17 arrived in ONE
      commit, so the reorganisations were the source repository's, not this one's
- [x] the owner has answered — *"if one shot migration useful as examples keep for
      didactic, otherwise fsh-guts"*
- [x] nothing removed before that answer — and **nothing removed after it
      either**: 8 files moved to `fsh-guts/`, 9 kept, 0 deleted


---

## REPORT AND DISPOSITION 2026-09-20

Owner's rule: *"if one shot migration useful as examples keep for didactic,
otherwise fsh-guts."* Applied below. **Nothing was deleted** — `fsh-guts` is
"the trashcan that is kept", so every body is still addressable and greppable and
a restore is one `git mv`.

### First, two corrections to this bean

**1 — "the fossil record of previous reorganisations of THIS repository" is
wrong.** `git log --follow` puts all 17 at **2026-09-17, in one commit** — the
bulk import (PR #209). A plain `--diff-filter=A` says `c25761d2` *"Move the
instance under cat-harness"* for every one of them, because the inversion recorded
an Add at each new path; `--follow` was needed to see through it. So the
stratigraphy is the **source** repository's, imported wholesale.

**2 — the 17 were classified by FILENAME, and five of them are not one-shots.**
`migrate-*`, `codemod-*`, `fix-*` is a pattern over names, and this is the same
failure recorded in `covered-is-not-reachable` §"The failure underneath": *a name
says what something is for; an argument list says what it does.* The worst case:

> **`codemod-leanval.ts` is a live CI drift gate.** `.github/workflows/witness-pipeline.yml:494`
> runs `bun run content/pipeline/codemod-leanval.ts --check`. It has five `--check`
> occurrences and four `--write`. `gates.ts:320` exempts it from the LOCAL set as
> `no-folio` — *"a codemod over a folio's Lean blocks"* — which is why it looked
> unused from here.

### KEPT — 9 files

| file | bytes | why it stays |
|---|---|---|
| `content/pipeline/codemod-leanval.ts` | 12,379 | **live**: `witness-pipeline.yml:494` runs it `--check` |
| `content/pipeline/migrate-lean-refs.ts` | 7,880 | **live**: `schemas/constraints.ts:132` puts `bun run migrate-lean-refs` in a *user-facing error message* |
| `scripts/audit-wiring-migrate.ts` | 7,905 | `repo-partition.ts:299` **assigns it to the `sci` repo** in the five-repo split |
| `scripts/migrate-computation-paths.ts` | 8,330 | `repo-partition.ts:303`, same — assigned, not scrap |
| `scripts/fix-lean-import-order.py` | 2,196 | `lean-generation.md:79` tells an agent to run it |
| `content/pipeline/codemod-refterm.ts` | 10,983 | **could-not-determine** + it has a test (`codemod-refterm.test.ts`) |
| `content/pipeline/codemod-val.ts` | 15,700 | could-not-determine |
| `content/pipeline/migrate-cites.ts` | 3,915 | could-not-determine |
| `content/pipeline/migrate-bib-verifier.ts` | 4,435 | could-not-determine |

**The four could-not-determine ones are kept on `d308`'s own correction**, not on
optimism: `content/pipeline/*.ts` are library modules invoked from a **folio's**
`package.json`, which cannot be read from this checkout. Their three "references"
turned out to be **comments** — `markdown-ast.ts:5`, `codemod-leanval.ts:6`,
`bib-verification.ts:20` — so the prose mentions prove nothing either way. Absent
evidence is not evidence of absence, and the third-state rule says so.

### MOVED to `fsh-guts/scripts/` — 8 files

| file | bytes | phase it executed or repaired |
|---|---|---|
| `migrate-probes-phase1.py` | 9,868 | phase 1: `*_probe.py` → `probes/` |
| `migrate-cluster-phase.py` | 9,673 | generalised phases 2–5 |
| `fix-moved-scripts.py` | 7,773 | *"post-move corrections for Phase 1/2"* |
| `fix-root-script-shim.py` | 5,572 | after phase 6 moved `substrate/` |
| `fix-cross-cluster-witness-loads.py` | 7,795 | *"After Phases 1-4"* |
| `materialize_iw_queue.py` | 7,064 | queue from audit witnesses |
| `wire_stale_claims.py` | 7,616 | `computation:` fields from `stale-claims.tsv` |
| `split-docs-page.py` | 6,907 | self-described *"One-shot migration helper"* |

**61,268 bytes**, all last touched 2026-09-19/20 by the inversion and never
otherwise. All eight are referenced by **nothing** outside themselves; the two
Python migration scripts reference each other and moved together, so that still
resolves. `scripts/migrations/` held only `split-docs-page.py` and is now gone.

**Why these and not the four codemods** — the distinction is the whole judgement,
and "absent from this repository" was not enough on its own:

> A **phase script is spent by construction.** An executed migration does not run
> twice, and no folio can be holding an entry point for phase 1 of a refactor that
> already reached phase 6. A codemod with a `--write` arm over live content is not
> spent, which is why `codemod-val` stayed and `migrate-probes-phase1` went.

Plus, measured: `cat-harness/computations/` holds **one** file, a `.witness.json`,
and **no Python at all** — no `substrate/`, no probes — and the proposal they cite
is gone.

### The didactic half of the rule, honoured by extraction

Two of the eight teach something transferable, so the lesson is written into prose
rather than left implicit in a script nobody will open:

- **[`migrate-cluster-phase.md`](../../../fsh-guts/scripts/migrate-cluster-phase.md)**
  — the four-step recipe in its fixed order, and why the order is the content
  (`git mv` so `--follow` works; co-move witnesses by `scriptFile` not by
  adjacency; inject the bridge; `HERE.parent` last, because step 3 changes what
  step 4 looks for).
- **[`split-docs-page.md`](../../../fsh-guts/scripts/split-docs-page.md)** — derive
  node ids with **the renderer's own slug rule** so existing anchors keep
  resolving, then **pin** them so a heading edit does not move a URL. A missing
  anchor scrolls to the top rather than erroring, so getting this wrong is silent.
- **[`computations-refactor-fixers.md`](../../../fsh-guts/scripts/computations-refactor-fixers.md)**
  — one record for the other six, because what they share is the finding: four of
  them are corrections to corrections.

That is better preservation than leaving them in `scripts/`, where the lesson was
only inferable by reading 61 KB of dead plumbing.

### The observation this bean wanted kept, now with evidence

> **A codemod is a commit, not a committed script.**

The chain proves it: `migrate-probes-phase1` → generalised into
`migrate-cluster-phase` → then `fix-moved-scripts` to repair the injector →
then `fix-root-script-shim` and `fix-cross-cluster-witness-loads` to repair what
the moves broke. Five files for one reorganisation, each a bulk edit preserved as a
file rather than as a diff — and the diff was in the history the whole time.

### Verified

- `bun run gates` — **56 of 56 pass** after the moves
- 0 files deleted; 8 moved with `git mv`, so `git log --follow` still reaches
  2026-09-17
