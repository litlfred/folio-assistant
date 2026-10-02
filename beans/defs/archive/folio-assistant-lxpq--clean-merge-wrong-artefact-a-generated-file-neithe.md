---
# folio-assistant-lxpq
title: 'CLEAN MERGE, WRONG ARTEFACT: a generated file neither side would emit, and no conflict to flag it'
status: completed
type: bug
priority: normal
created_at: 2026-09-22T08:41:04Z
updated_at: 2026-09-22T08:58:35Z
parent: folio-assistant-1xhc
---

Measured on `main` at `3341108a`, 2026-09-22, minutes after it landed.

## What happened

Two branches changed the SAME generated artefact in ways git merged cleanly:

| side | change to `docs/assets/voices/index.json` |
|---|---|
| main (`tis1`) | added `tile.voices.count` — a projection declares its own count |
| #827 (`26tu`) | added a sixth voice, `agent-skill-authoring` |

Git had no textual conflict: one side touched the header, the other the array.
The merged file therefore declared **`count: 5` while listing 6 voices** —
an artefact **neither side would ever emit**, and precisely the failure
`tis1` was built to make visible ("a badge also makes a WRONG count visible,
where a dimmed tile only ever answers empty-or-not").

`voices:viz:check` catches it. It is in `gates`, not in the fast subset I had
already run, and I merged the PR while `gates --all` was still executing. So
the gate did its job and the human did not wait for it.

## Why this is NOT bean `520m`

`520m` is about generated artefacts that CONFLICT on a base merge — noisy, but
git stops you. This is the opposite and worse: **no conflict, no signal, a
wrong artefact.** A conflict is a question; a clean merge is an assertion that
the result is correct, and here it was not.

`qa:resolve-conflicts` cannot help either — it only ever looks at unmerged
paths, and there were none.

## The general shape

> A generated artefact committed to the repository can be merged into a state
> **no generator would produce**, whenever two branches touch different parts
> of it. The only reliable check is to RE-RUN THE GENERATOR after every merge,
> not to inspect the diff.

This branch already regenerated `kg-audit`, `harness.json` and
`published-graphs.md` after each merge by habit. `voices:viz` was missed
because the merge was CLEAN and nothing prompted it.

## Done when

- [x] `main` is green on `voices:viz:check` again
- [ ] the owner has decided whether a post-merge "regenerate everything
      declared" step is worth having, versus relying on the gates — the cheap
      version is one script that runs every `*:check`'s writer after a base
      merge, and it is exactly the blast-radius question `520m` left open

## Settled — owner, 2026-09-22: BUILD the post-merge step

`bun run regen` (`cat-harness/scripts/regen-after-merge.ts`), with `--all` and
`--dry-run`.

### It ASKS the gates rather than regenerating everything

"Regenerate everything declared" was the obvious repair and is wrong twice:

1. **It needs a list, and the list is the defect.** `gates.ts` already settled
   the authority — the WORKFLOW, not `package.json` — having measured that
   **21** of this repository's `:check` scripts appear in no workflow at all. A
   second list here would run generators CI does not gate: a guess that reads
   as coverage. So the set comes from `loadGates`, and a check CI does not run
   is not this command's business. **35 verify/write pairs** in the fast set,
   out of 112 gates.
2. **A blanket regeneration cannot tell repair from damage.** Rewriting
   artefacts that were already correct leaves a diff that says nothing about
   what the merge broke. Asking each check first means the output IS the set of
   artefacts the merge left wrong — the question a person actually has.

### Four states, and the two that exit non-zero

| state | meaning |
|---|---|
| `current` | check passed, nothing run |
| `regenerated` | check failed, writer ran, check now passes |
| **`unrepaired`** | check failed, writer ran, **still fails** — a real defect |
| **`no-writer`** | check failed and has no writer counterpart |

The check is re-run AFTER the writer, deliberately. A writer that ran is not a
repair that worked, and reporting it as one would be the false-clean this whole
bean is about.

### Falsified against the real defect, not a hypothetical

Re-injected the exact artefact the clean merge produced — `count: 5` beside six
listed voices — and ran it:

```
  ✓ voices:viz:check was stale — regenerated with `bun run voices:viz`
  34 current, 1 regenerated, 0 unrepaired, 0 without a writer
```

It found the one broken artefact and left the other 34 alone, which is the
precision the design is for. 11 unit tests cover the pairing, the
workflow-derived set, and that a check with no writer is carried through as a
finding rather than filtered out.

### The discipline, where it will be hit

`prepare-merge.md` §"A clean merge can produce a wrong artefact" (STRICT), and
in the recipe's merge step: **run it after EVERY base merge, conflicted or
not.**

## Done when

- [x] `main` is green on `voices:viz:check` again
- [x] the owner has decided whether a post-merge regeneration step is worth
      having — yes, and it asks the gates rather than carrying a list
